/**
 * Discord Gateway client — persistent WebSocket connection + interaction handler.
 * Exports mutable `botState`, `buttonActions`, and control functions.
 */
const { WebSocket } = require('ws');
const { discordFetch, respondToInteraction } = require('./discordFetch');

const GATEWAY_URL    = 'wss://gateway.discord.gg/?v=10&encoding=json';
const GUILDS_INTENT  = 1 << 0;

// ── Shared state (mutated by gateway events) ──────────────────────────────────
const botState = {
    status: 'disconnected',
    error:  null,
    token:  null,
    guilds: [],
    sessionId:         null,
    resumeGatewayUrl:  null,
    userId:            null,
    botUser:           null,
};

let buttonActions = {};

let ws                  = null;
let heartbeatTimer      = null;
let jitterTimer         = null;
let heartbeatAckReceived = true;
let sequence            = null;
let reconnectTimer      = null;
let reconnectAttempts   = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────
function gwSend(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

function gwCleanup() {
    if (heartbeatTimer)  { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (jitterTimer)     { clearTimeout(jitterTimer);     jitterTimer = null; }
    if (reconnectTimer)  { clearTimeout(reconnectTimer);  reconnectTimer = null; }
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

// ── Interaction handler ───────────────────────────────────────────────────────
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

    const userId   = member?.user?.id ?? user?.id;
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
                    content:    replyStep.content?.trim() || undefined,
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
                            botState.token, { method: 'PUT' }
                        );
                        console.log(`[Interaction] Gave role ${step.roleId} to ${userId}`);
                    }
                    break;

                case 'remove_role':
                    if (guild_id && userId && step.roleId) {
                        await discordFetch(
                            `/guilds/${guild_id}/members/${userId}/roles/${step.roleId}`,
                            botState.token, { method: 'DELETE' }
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
                            body:   JSON.stringify({ recipient_id: userId }),
                        });
                        if (dm?.id) {
                            await discordFetch(`/channels/${dm.id}/messages`, botState.token, {
                                method: 'POST',
                                body:   JSON.stringify({ content: step.content }),
                            });
                            console.log(`[Interaction] DM'd user ${userId}`);
                        }
                    }
                    break;

                case 'delete_message':
                    if (message?.id && channel_id) {
                        await discordFetch(
                            `/channels/${channel_id}/messages/${message.id}`,
                            botState.token, { method: 'DELETE' }
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

// ── Public API ────────────────────────────────────────────────────────────────
function gwConnect(token, gatewayUrl = GATEWAY_URL) {
    if (ws) { ws.removeAllListeners(); ws.terminate(); ws = null; }
    gwCleanup();

    botState.status = 'connecting';
    botState.error  = null;

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
                    botState.sessionId        = d.session_id;
                    botState.resumeGatewayUrl = d.resume_gateway_url;
                    botState.userId           = d.user?.id ?? null;
                    botState.botUser          = d.user ? {
                        id:            d.user.id,
                        username:      d.user.username,
                        discriminator: d.user.discriminator,
                        avatar:        d.user.avatar,
                        bot:           true,
                    } : null;
                    botState.status           = 'connected';
                    reconnectAttempts         = 0;
                    console.log(`[Gateway] Ready! Bot: ${d.user?.username}#${d.user?.discriminator}`);
                    gwUpdatePresence({
                        type: 0,
                        name: 'OpenEmbedded',
                        url:  'https://discord.builders',
                    });
                }
                if (t === 'RESUMED') {
                    botState.status   = 'connected';
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
                setTimeout(
                    () => gwConnect(token, d ? (botState.resumeGatewayUrl || GATEWAY_URL) : GATEWAY_URL),
                    1000 + Math.random() * 4000
                );
                break;
        }
    });

    ws.on('close', (code, reason) => {
        gwCleanup();
        console.log(`[Gateway] Closed with code ${code}: ${reason}`);

        const FATAL_CODES = { 4004: 'Authentication failed — invalid bot token.', 4014: 'Disallowed intents — enable privileged intents in the Discord Developer Portal.', 4013: 'Invalid intents sent to Discord.', 4011: 'Bot requires sharding — too many guilds.' };
        if (FATAL_CODES[code]) {
            botState.status = 'error';
            botState.error  = FATAL_CODES[code];
            botState.token  = null;
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
    botState.token           = null;
    botState.status          = 'disconnected';
    botState.error           = null;
    botState.guilds          = [];
    botState.sessionId       = null;
    botState.resumeGatewayUrl = null;
    sequence                 = null;
    reconnectAttempts        = 0;
}

/**
 * Update the bot's own Gateway presence (OP 3).
 * This sets what Discord servers see on the bot's profile while it is connected.
 * Pass null to clear the activity and show only "online".
 * @param {object|null} activity
 */
function gwUpdatePresence(activity = null) {
    gwSend({
        op: 3,
        d: {
            since:      null,
            activities: activity ? [activity] : [],
            status:     'online',
            afk:        false,
        },
    });
    console.log(`[Gateway] Presence updated: ${activity ? activity.name : '(cleared)'}`);
}

function setButtonActions(actions) {
    buttonActions = actions;
}

function getButtonActions() {
    return buttonActions;
}

module.exports = { botState, gwConnect, gwDisconnect, gwUpdatePresence, setButtonActions, getButtonActions };
