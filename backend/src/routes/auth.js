const express = require('express');
const bcrypt  = require('bcryptjs');

const router = express.Router();

// ── Admin credential hash (set once on startup) ───────────────────────────────
let adminPasswordHash = null;

async function initAuth() {
    const email    = (process.env.ADMIN_EMAIL    || '').trim();
    const password = (process.env.ADMIN_PASSWORD || '').trim();
    if (!email || !password) {
        console.warn('[Auth] ⚠️  ADMIN_EMAIL and ADMIN_PASSWORD are not set in environment secrets.');
        console.warn('[Auth] Login will be disabled until both are configured.');
        return;
    }
    adminPasswordHash = await bcrypt.hash(password, 12);
    console.log(`[Auth] Admin credentials loaded for: ${email}`);
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', (req, res) => {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim())
        return res.status(400).json({ error: 'Email is required.' });
    if (!password || typeof password !== 'string' || !password.trim())
        return res.status(400).json({ error: 'Password is required.' });

    req.session.user = {
        id:    email.trim().toLowerCase(),
        email: email.trim(),
    };

    res.json({ ok: true });
});

// ── GET /api/auth/user ────────────────────────────────────────────────────────
router.get('/user', (req, res) => {
    if (!req.session?.user) return res.status(401).json({ message: 'Unauthorized' });
    res.json(req.session.user);
});

// ── GET /api/logout ───────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

module.exports = { router, initAuth };
