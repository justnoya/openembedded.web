/**
 * backend/src/index.js — OpenEmbedded API server entry point
 *
 * Wires together session middleware, auth routes, and bot routes.
 * Can be run directly (node src/index.js) or required by api/index.js
 * for Vercel serverless deployment.
 */
const express           = require('express');
const sessionMiddleware = require('./middleware/session');
const { router: authRouter, initAuth } = require('./routes/auth');
const botRouter         = require('./routes/bot');
const { loadActionsFromDb } = require('./lib/db');
const { setButtonActions }  = require('./lib/gateway');

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

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
    initAuth().then(async () => {
        // Restore button actions from DB (no-op if DATABASE_URL not set)
        const savedActions = await loadActionsFromDb();
        if (Object.keys(savedActions).length > 0) {
            setButtonActions(savedActions);
        }

        const PORT = process.env.BOT_SERVER_PORT || 3001;
        app.listen(PORT, () => console.log(`[Server] Bot API running on port ${PORT}`));
    });
}

module.exports = app;
