const express = require('express');
const { WebSocket } = require('ws');

const app = express();
app.use(express.json());

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
};

let ws = null;
let heartbeatTimer = null;
let jitterTimer = null;
let heartbeatAckReceived = true;
let sequence = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

// ── Gateway helpers ───────────────────────────────────────────────────────────
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
            case 10: { // HELLO — heartbeat then identify / resume
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
            case 11: // HEARTBEAT_ACK
                heartbeatAckReceived = true;
                break;

            case 1:  // Server requests immediate heartbeat
                gwSend({ op: 1, d: sequence });
                break;

            case 0:  // DISPATCH
                if (t === 'READY') {
                    botState.sessionId = d.session_id;
                    botState.resumeGatewayUrl = d.resume_gateway_url;
                    botState.status = 'connected';
                    reconnectAttempts = 0;
                    console.log(`[Gateway] Ready! Bot: ${d.user?.username}#${d.user?.discriminator}`);
                }
                if (t === 'RESUMED') {
                    botState.status = 'connected';
                    reconnectAttempts = 0;
                    console.log('[Gateway] Session resumed');
                }
                break;

            case 7:  // RECONNECT requested by Discord
                console.log('[Gateway] Discord requested reconnect');
                gwReconnect();
                break;

            case 9:  // Invalid session
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

        const FATAL_CODES = [4004, 4013, 4014];
        const NON_RESUMABLE = [4004, 4010, 4011, 4012, 4013, 4014];

        if (code === 4004) {
            botState.status = 'error';
            botState.error = 'Authentication failed — invalid bot token.';
            botState.token = null;
            return;
        }
        if (code === 4014) {
            botState.status = 'error';
            botState.error = 'Disallowed intents — enable privileged intents in the Discord Developer Portal (Bot → Privileged Gateway Intents).';
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

        // Not a fatal close — auto-reconnect
        if (!botState.token) return;
        if (NON_RESUMABLE.includes(code)) { botState.sessionId = null; botState.resumeGatewayUrl = null; }
        gwReconnect();
    });

    ws.on('error', (err) => {
        console.error('[Gateway] WebSocket error:', err.message);
        // onclose fires after onerror, so reconnect is handled there
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

// ── Discord REST helper ───────────────────────────────────────────────────────
async function discordFetch(path, token, options = {}) {
    const res = await fetch(`https://discord.com/api/v10${path}`, {
        ...options,
        headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Discord API error ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
}

// ── Express API ───────────────────────────────────────────────────────────────
app.post('/api/bot/start', async (req, res) => {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string' || !token.trim()) {
        return res.status(400).json({ error: 'Bot token is required.' });
    }
    const trimmed = token.trim();

    // Validate token + fetch guilds before connecting gateway
    let guilds;
    try {
        guilds = await discordFetch('/users/@me/guilds', trimmed);
    } catch (e) {
        return res.status(401).json({ error: e.message || 'Invalid bot token.' });
    }

    // Stop any existing connection
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
        res.json(channels.sort((a, b) => a.position - b.position));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/bot/channels/:channelId/messages', async (req, res) => {
    if (!botState.token) return res.status(401).json({ error: 'Bot not connected.' });
    try {
        const result = await discordFetch(
            `/channels/${req.params.channelId}/messages`,
            botState.token,
            { method: 'POST', body: JSON.stringify(req.body) }
        );
        res.json(result || { status: 'Success' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.BOT_SERVER_PORT || 3001;
app.listen(PORT, () => console.log(`[Server] Bot API running on port ${PORT}`));
