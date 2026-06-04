/**
 * backend/src/index.js — OpenEmbedded API server entry point
 *
 * Wires together session middleware, auth routes, and bot routes.
 * Can be run directly (node src/index.js) or required by api/index.js
 * for Vercel serverless deployment.
 */
const express           = require('express');
const path              = require('path');
const fs                = require('fs');
const sessionMiddleware = require('./middleware/session');
const { router: authRouter, initAuth } = require('./routes/auth');
const botRouter         = require('./routes/bot');
const { loadActionsFromDb } = require('./lib/db');
const { setButtonActions, gwConnect } = require('./lib/gateway');
const { discordFetch } = require('./lib/discordFetch');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(sessionMiddleware);

// ── Auth routes (public — no session guard) ───────────────────────────────────
app.use('/api/auth', authRouter);

// GET /api/logout clears the cookie
app.get('/api/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

// ── Auth guard for all remaining /api/* routes ────────────────────────────────
app.use('/api', (req, res, next) => {
    if (!req.session?.user) return res.status(401).json({ message: 'Unauthorized' });
    next();
});

// ── Bot routes ────────────────────────────────────────────────────────────────
app.use('/api/bot', botRouter);

// ── Serve built frontend in production ───────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

if (isProd && fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // SPA fallback — all non-API routes serve index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
    console.log(`[Server] Serving frontend from ${frontendDist}`);
}

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
    initAuth().then(async () => {
        const savedActions = await loadActionsFromDb();
        if (Object.keys(savedActions).length > 0) {
            setButtonActions(savedActions);
        }

        // ── Auto-connect official bot from env ────────────────────────────────
        const envToken = process.env.DISCORD_BOT_TOKEN;
        if (envToken) {
            console.log('[Server] DISCORD_BOT_TOKEN found — auto-connecting bot...');
            try {
                const guilds = await discordFetch('/users/@me/guilds', envToken);
                const { botState } = require('./lib/gateway');
                botState.token  = envToken;
                botState.guilds = Array.isArray(guilds)
                    ? guilds.sort((a, b) => a.name.localeCompare(b.name))
                    : [];
                gwConnect(envToken);
            } catch (err) {
                console.error('[Server] Auto-connect failed:', err.message);
            }
        }

        const PORT = process.env.PORT || process.env.BOT_SERVER_PORT || (isProd ? 8080 : 3001);
        app.listen(PORT, '0.0.0.0', () => console.log(`[Server] Running on port ${PORT} (${isProd ? 'production' : 'development'})`));
    });
}

module.exports = app;
