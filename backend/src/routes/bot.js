const express = require('express');
const { botState, gwConnect, gwDisconnect, setButtonActions } = require('../lib/gateway');
const { discordFetch } = require('../lib/discordFetch');

const router = express.Router();

// ── POST /api/bot/actions — register button → action-step mappings ────────────
router.post('/actions', (req, res) => {
    const { actions } = req.body || {};
    if (actions && typeof actions === 'object') {
        setButtonActions(actions);
        console.log(`[Actions] Registered ${Object.keys(actions).length} button action(s): ${Object.keys(actions).join(', ') || '(none)'}`);
    }
    res.json({ ok: true });
});

// ── POST /api/bot/start ───────────────────────────────────────────────────────
router.post('/start', async (req, res) => {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string' || !token.trim())
        return res.status(400).json({ error: 'Bot token is required.' });

    const trimmed = token.trim();
    let guilds;
    try {
        guilds = await discordFetch('/users/@me/guilds', trimmed);
    } catch (e) {
        return res.status(401).json({ error: e.message || 'Invalid bot token.' });
    }

    gwDisconnect();
    botState.token  = trimmed;
    botState.guilds = guilds.sort((a, b) => a.name.localeCompare(b.name));
    gwConnect(trimmed);

    res.json({ ok: true, guilds: botState.guilds });
});

// ── POST /api/bot/stop ────────────────────────────────────────────────────────
router.post('/stop', (req, res) => {
    gwDisconnect();
    res.json({ ok: true });
});

// ── GET /api/bot/status ───────────────────────────────────────────────────────
router.get('/status', (req, res) => {
    res.json({
        status:   botState.status,
        error:    botState.error,
        guilds:   botState.guilds,
        hasToken: !!botState.token,
    });
});

// ── GET /api/bot/guilds/:guildId/channels ─────────────────────────────────────
router.get('/guilds/:guildId/channels', async (req, res) => {
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

// ── POST /api/bot/channels/:channelId/messages ────────────────────────────────
router.post('/channels/:channelId/messages', async (req, res) => {
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
                const blob   = new Blob([binary], { type });
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

module.exports = router;
