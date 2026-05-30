const express = require('express');
const { WebSocket } = require('ws');
const cookieSession = require('cookie-session');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// ── Cookie-based session ───────────────────────────────────────────────────────
app.use(cookieSession({
    name: 'oe_session',
    keys: [process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')],
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
}));

// ── Auth setup ─────────────────────────────────────────────────────────────────
let adminPasswordHash = null;

async function initAuth() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        console.warn('[Auth] ⚠️  ADMIN_EMAIL and ADMIN_PASSWORD are not set in environment secrets.');
        console.warn('[Auth] Login will be disabled until both are configured.');
        return;
    }
    adminPasswordHash = await bcrypt.hash(password, 12);
    console.log(`[Auth] Admin credentials loaded for: ${email}`);
}

// ── Rate limiter (per IP, max 10 attempts / 15 min) ───────────────────────────
const loginAttempts = new Map(); // ip → { count, resetAt }

function checkRateLimit(ip) {
    const now = Date.now();
    const WINDOW_MS = 15 * 60 * 1000;
    const MAX_ATTEMPTS = 10;

    let entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + WINDOW_MS };
        loginAttempts.set(ip, entry);
    }

    if (entry.count >= MAX_ATTEMPTS) {
        const waitSec = Math.ceil((entry.resetAt - now) / 1000);
        return { limited: true, waitSec };
    }

    entry.count++;
    return { limited: false };
}

// Clean up old rate-limit entries every 30 min
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of loginAttempts) {
        if (now > entry.resetAt) loginAttempts.delete(ip);
    }
}, 30 * 60 * 1000);

// ── POST /api/auth/login ───────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const limit = checkRateLimit(ip);
    if (limit.limited) {
        return res.status(429).json({ error: `Too many attempts. Try again in ${limit.waitSec}s.` });
    }

    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail || !adminPasswordHash) {
        return res.status(503).json({ error: 'Authentication is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in Secrets.' });
    }

    // Constant-time email compare to avoid timing attacks
    const emailMatch = crypto.timingSafeEqual(
        Buffer.from(email.trim().toLowerCase()),
        Buffer.from(adminEmail.trim().toLowerCase())
    );

    const passwordMatch = await bcrypt.compare(password, adminPasswordHash);

    if (!emailMatch || !passwordMatch) {
        return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    req.session.user = {
        id: 'admin',
        email: adminEmail,
    };

    res.json({ ok: true });
});

// ── GET /api/logout ────────────────────────────────────────────────────────────
app.get('/api/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

// ── GET /api/auth/user ─────────────────────────────────────────────────────────
app.get('/api/auth/user', (req, res) => {
    if (!req.session?.user) return res.status(401).json({ message: 'Unauthorized' });
    res.json(req.session.user);
});

// ── Auth guard for all remaining /api/* routes ────────────────────────────────
app.use('/api', (req, res, next) => {
    if (!req.session?.user) return res.status(401).json({ message: 'Unauthorized' });
    next();
});

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
const GUILDS_INTENT = 1 << 0;

// ── Persistent bot state ──────────────────────────────────────────────────────
let botState = {
    status: 'disconnected',
    error: null,
    token: null,
    guilds: [],
    sessionId: null,
    resumeGatewayUrl: null,
    userId: null,
};

let buttonActions = {};

let ws = null;
let heartbeatTimer = null;
let jitterTimer = null;
let heartbeatAckReceived = true;
let sequence = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

function gwSend(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

function gwCleanup() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (jitterTimer) { clearTimeout(jitterTimer); jitterTimer = null; }
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
}

function gwStartHeartbeat(interval) {
    const jitter = Math.random();
    jitterTimer = setTimeout(() => {
        jitterTimer = null;
        gwSend({ op: 1, d: sequence });
        heartbeatAckReceived = false;

        heartbeatTimer = setInterval(() => {
            if (!heartbeatAckReceived) {
                console.log('[Gateway] Missed heartbeat ACK — reconnecting…');
                gwReconnect();
                return;
            }
            heartbeatAckReceived = false;
            gwSend({ op: 1, d: sequence });
        }, interval);
    }, interval * jitter);
}

function gwReconnect() {
    if (ws) { ws.removeAllListeners(); ws.terminate(); ws = null; }
    gwCleanup();
    if (!botState.token) return;

    const url = botState.resumeGatewayUrl || GATEWAY_URL;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) + Math.random() * 1000;
    reconnectAttempts = Math.min(reconnectAttempts + 1, 8);
    botState.status = 'connecting';

    console.log(`[Gateway] Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts})…`);
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        gwConnect(botState.token, url);
    }, delay);
}

function gwConnect(token, gatewayUrl = GATEWAY_URL) {
    if (ws) { ws.removeAllListeners(); ws.terminate(); ws = null; }
    gwCleanup();

    botState.status = 'connecting';
    botState.error = null;

    console.log(`[Gateway] Connecting to ${gatewayUrl}`);
    ws = new WebSocket(gatewayUrl);

    ws.on('open', () => console.log('[Gateway] WebSocket open'));

    ws.on('message', (raw) => {
        let payload;
        try { payload = JSON.parse(raw.toString()); } catch { return; }

        const { op, d, s, t } = payload;
        if (s != null) sequence = s;

        switch (op) {
            case 10: {
                gwStartHeartbeat(d.heartbeat_interval);
                if (botState.sessionId && botState.resumeGatewayUrl) {
                    console.log('[Gateway] Resuming session…');
                    gwSend({ op: 6, d: { token: `Bot ${token}`, session_id: botState.sessionId, seq: sequence } });
                } else {
                    console.log('[Gateway] Identifying…');
                    gwSend({
                        op: 2,
                        d: {
                            token: `Bot ${token}`,
                            intents: GUILDS_INTENT,
                            properties: { os: 'linux', browser: 'discord.builders', device: 'discord.builders' },
                            presence: { since: null, activities: [], status: 'online', afk: false },
                        },
                    });
                }
                break;
            }
            case 11:
                heartbeatAckReceived = true;
                break;

            case 1:
                gwSend({ op: 1, d: sequence });
                break;

            case 0:
                if (t === 'READY') {
                    botState.sessionId = d.session_id;
                    botState.resumeGatewayUrl = d.resume_gateway_url;
                    botState.userId = d.user?.id ?? null;
                    botState.status = 'connected';
                    reconnectAttempts = 0;
                    console.log(`[Gateway] Ready! Bot: ${d.user?.username}#${d.user?.discriminator}`);
                }
                if (t === 'RESUMED') {
                    botState.status = 'connected';
                    reconnectAttempts = 0;
                    console.log('[Gateway] Session resumed');
                }
                if (t === 'INTERACTION_CREATE') {
                    handleInteraction(d).catch(e =>
                        console.error('[Interaction] Unhandled error:', e.message)
                    );
                }
                break;

            case 7:
                console.log('[Gateway] Discord requested reconnect');
                gwReconnect();
                break;

            case 9:
                console.log(`[Gateway] Invalid session (resumable=${d})`);
                if (!d) { botState.sessionId = null; botState.resumeGatewayUrl = null; }
                setTimeout(() => gwConnect(token, d ? (botState.resumeGatewayUrl || GATEWAY_URL) : GATEWAY_URL),
                    1000 + Math.random() * 4000);
                break;
        }
    });

    ws.on('close', (code, reason) => {
        gwCleanup();
        console.log(`[Gateway] Closed with code ${code}: ${reason}`);

        if (code === 4004) {
            botState.status = 'error';
            botState.error = 'Authentication failed — invalid bot token.';
            botState.token = null;
            return;
        }
        if (code === 4014) {
            botState.status = 'error';
            botState.error = 'Disallowed intents — enable privileged intents in the Discord Developer Portal.';
            botState.token = null;
            return;
        }
        if (code === 4013) {
            botState.status = 'error';
            botState.error = 'Invalid intents sent to Discord.';
            botState.token = null;
            return;
        }
        if (code === 4011) {
            botState.status = 'error';
            botState.error = 'Bot requires sharding — too many guilds.';
            botState.token = null;
            return;
        }

        const NON_RESUMABLE = [4004, 4010, 4011, 4012, 4013, 4014];
        if (!botState.token) return;
        if (NON_RESUMABLE.includes(code)) { botState.sessionId = null; botState.resumeGatewayUrl = null; }
        gwReconnect();
    });

    ws.on('error', (err) => {
        console.error('[Gateway] WebSocket error:', err.message);
    });
}

function gwDisconnect() {
    if (ws) { ws.removeAllListeners(); ws.terminate(); ws = null; }
    gwCleanup();
    botState.token = null;
    botState.status = 'disconnected';
    botState.error = null;
    botState.guilds = [];
    botState.sessionId = null;
    botState.resumeGatewayUrl = null;
    sequence = null;
    reconnectAttempts = 0;
}

async function discordFetch(path, token, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = {};
    if (token) headers.Authorization = `Bot ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';
    Object.assign(headers, options.headers || {});

    const res = await fetch(`https://discord.com/api/v10${path}`, {
        ...options,
        headers,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(body?.message || `Discord API error ${res.status}`);
        err.discordBody = body;
        err.httpStatus  = res.status;
        throw err;
    }
    return res.status === 204 ? null : res.json();
}

async function respondToInteraction(interactionId, interactionToken, data) {
    return discordFetch(`/interactions/${interactionId}/${interactionToken}/callback`, null, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

async function handleInteraction(interaction) {
    const { id, token, type, data, member, user, guild_id, channel_id, message } = interaction;

    if (type !== 3) return;
    if (!data?.custom_id) return;

    const componentType = data.component_type;
    let action;
    let customId;

    if (componentType === 3) {
        const selectedValues = data.values || [];
        const matchedValue = selectedValues.find(v => buttonActions[v]);
        if (matchedValue) {
            action = buttonActions[matchedValue];
            customId = matchedValue;
            console.log(`[Interaction] Select menu option "${matchedValue}" applied`);
        } else {
            customId = data.custom_id;
            action = buttonActions[customId];
        }
    } else {
        customId = data.custom_id;
        action = buttonActions[customId];
    }

    if (!action || !action.steps?.length) {
        await respondToInteraction(id, token, { type: 6 }).catch(e =>
            console.error('[Interaction] ACK failed:', e.message));
        return;
    }

    console.log(`[Interaction] Button "${customId}" clicked — executing ${action.steps.length} step(s)`);

    const userId = member?.user?.id ?? user?.id;
    const replyStep = action.steps.find(s => s.type === 'reply' || s.type === 'reply_embed');

    if (replyStep) {
        let components = [];
        if (replyStep.embedJson) {
            try { components = JSON.parse(replyStep.embedJson); } catch {}
        }
        const flags = (components.length > 0 ? 32768 : 0) | (replyStep.ephemeral ? 64 : 0);
        try {
            await respondToInteraction(id, token, {
                type: 4,
                data: {
                    content: replyStep.content?.trim() || undefined,
                    components,
                    flags,
                },
            });
        } catch (e) {
            console.error('[Interaction] Reply failed:', e.message, e.discordBody);
            await respondToInteraction(id, token, { type: 6 }).catch(() => {});
        }
    } else {
        await respondToInteraction(id, token, { type: 6 }).catch(e =>
            console.error('[Interaction] ACK failed:', e.message));
    }

    for (const step of action.steps) {
        if (step === replyStep) continue;
        try {
            switch (step.type) {
                case 'give_role':
                    if (guild_id && userId && step.roleId) {
                        await discordFetch(
                            `/guilds/${guild_id}/members/${userId}/roles/${step.roleId}`,
                            botState.token,
                            { method: 'PUT' }
                        );
                        console.log(`[Interaction] Gave role ${step.roleId} to ${userId}`);
                    }
                    break;

                case 'remove_role':
                    if (guild_id && userId && step.roleId) {
                        await discordFetch(
                            `/guilds/${guild_id}/members/${userId}/roles/${step.roleId}`,
                            botState.token,
                            { method: 'DELETE' }
                        );
                        console.log(`[Interaction] Removed role ${step.roleId} from ${userId}`);
                    }
                    break;

                case 'send_channel':
                    if (step.channelId) {
                        await discordFetch(
                            `/channels/${step.channelId}/messages`,
                            botState.token,
                            { method: 'POST', body: JSON.stringify({ content: step.content || '' }) }
                        );
                        console.log(`[Interaction] Sent message to channel ${step.channelId}`);
                    }
                    break;

                case 'dm_user':
                    if (userId && step.content) {
                        const dm = await discordFetch('/users/@me/channels', botState.token, {
                            method: 'POST',
                            body: JSON.stringify({ recipient_id: userId }),
                        });
                        if (dm?.id) {
                            await discordFetch(`/channels/${dm.id}/messages`, botState.token, {
                                method: 'POST',
                                body: JSON.stringify({ content: step.content }),
                            });
                            console.log(`[Interaction] DM'd user ${userId}`);
                        }
                    }
                    break;

                case 'delete_message':
                    if (message?.id && channel_id) {
                        await discordFetch(
                            `/channels/${channel_id}/messages/${message.id}`,
                            botState.token,
                            { method: 'DELETE' }
                        );
                        console.log(`[Interaction] Deleted message ${message.id}`);
                    }
                    break;
            }
        } catch (err) {
            console.error(`[Interaction] Step "${step.type}" failed:`, err.message);
        }
    }
}

app.post('/api/bot/actions', (req, res) => {
    const { actions } = req.body || {};
    if (actions && typeof actions === 'object') {
        buttonActions = actions;
        console.log(`[Actions] Registered ${Object.keys(buttonActions).length} button action(s): ${Object.keys(buttonActions).join(', ') || '(none)'}`);
    }
    res.json({ ok: true });
});

app.post('/api/bot/start', async (req, res) => {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string' || !token.trim()) {
        return res.status(400).json({ error: 'Bot token is required.' });
    }
    const trimmed = token.trim();

    let guilds;
    try {
        guilds = await discordFetch('/users/@me/guilds', trimmed);
    } catch (e) {
        return res.status(401).json({ error: e.message || 'Invalid bot token.' });
    }

    gwDisconnect();

    botState.token = trimmed;
    botState.guilds = guilds.sort((a, b) => a.name.localeCompare(b.name));
    gwConnect(trimmed);

    res.json({ ok: true, guilds: botState.guilds });
});

app.post('/api/bot/stop', (req, res) => {
    gwDisconnect();
    res.json({ ok: true });
});

app.get('/api/bot/status', (req, res) => {
    res.json({
        status: botState.status,
        error: botState.error,
        guilds: botState.guilds,
        hasToken: !!botState.token,
    });
});

app.get('/api/bot/guilds/:guildId/channels', async (req, res) => {
    if (!botState.token) return res.status(401).json({ error: 'Bot not connected.' });
    try {
        const channels = await discordFetch(`/guilds/${req.params.guildId}/channels`, botState.token);
        if (!Array.isArray(channels)) {
            console.error('[Channels] Unexpected response:', channels);
            return res.status(500).json({ error: 'Unexpected response from Discord.' });
        }
        res.json(channels);
    } catch (e) {
        const status = e.httpStatus || 500;
        const body   = e.discordBody || { message: e.message };
        console.error(`[Channels] ✗ HTTP ${status}:`, JSON.stringify(body));
        res.status(status).json(body);
    }
});

app.post('/api/bot/channels/:channelId/messages', async (req, res) => {
    if (!botState.token) return res.status(401).json({ error: 'Bot not connected.' });

    const channelId = req.params.channelId;
    const { attachments, ...discordPayload } = req.body;

    console.log(`[Send] → channel ${channelId}  flags=${discordPayload.flags}  components=${discordPayload.components?.length ?? 0}  files=${attachments?.length ?? 0}`);

    try {
        let fetchOptions;

        if (attachments && attachments.length > 0) {
            const form = new FormData();
            form.append('payload_json', JSON.stringify(discordPayload));
            for (let i = 0; i < attachments.length; i++) {
                const { name, data, type } = attachments[i];
                const binary = Buffer.from(data, 'base64');
                const blob = new Blob([binary], { type });
                form.append(`files[${i}]`, blob, name);
            }
            fetchOptions = { method: 'POST', body: form };
        } else {
            fetchOptions = { method: 'POST', body: JSON.stringify(discordPayload) };
        }

        const result = await discordFetch(
            `/channels/${channelId}/messages`,
            botState.token,
            fetchOptions
        );
        console.log(`[Send] ✓ Success`);
        res.json(result || { status: 'Success' });
    } catch (e) {
        const status = e.httpStatus || 500;
        const body   = e.discordBody || { message: e.message };
        console.error(`[Send] ✗ HTTP ${status}:`, JSON.stringify(body));
        res.status(status).json(body);
    }
});

// ── Start ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
    initAuth().then(() => {
        const PORT = process.env.BOT_SERVER_PORT || 3001;
        app.listen(PORT, () => console.log(`[Server] Bot API running on port ${PORT}`));
    });
}

module.exports = app;
