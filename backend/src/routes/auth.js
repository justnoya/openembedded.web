const express = require('express');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const router = express.Router();

// ── Admin credential hash (set once on startup) ───────────────────────────────
let adminEmail        = null;
let adminPasswordHash = null;

async function initAuth() {
    const email    = (process.env.ADMIN_EMAIL    || '').trim();
    const password = (process.env.ADMIN_PASSWORD || '').trim();
    if (!email || !password) {
        console.warn('[Auth] ⚠️  ADMIN_EMAIL and ADMIN_PASSWORD are not set in environment secrets.');
        console.warn('[Auth] Login will be disabled until both are configured.');
        return;
    }
    adminEmail        = email.toLowerCase();
    adminPasswordHash = await bcrypt.hash(password, 12);
    console.log(`[Auth] Admin credentials loaded for: ${email}`);
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim())
        return res.status(400).json({ error: 'Email is required.' });
    if (!password || typeof password !== 'string' || !password.trim())
        return res.status(400).json({ error: 'Password is required.' });

    if (!adminEmail || !adminPasswordHash)
        return res.status(503).json({ error: 'Login is not configured on this server.' });

    const emailMatch    = email.trim().toLowerCase() === adminEmail;
    const passwordMatch = await bcrypt.compare(password, adminPasswordHash);

    if (!emailMatch || !passwordMatch) {
        // Constant-time response to prevent timing attacks
        await bcrypt.compare('dummy', '$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.user = {
        id:       adminEmail,
        email:    email.trim(),
        provider: 'password',
    };

    res.json({ ok: true });
});

// ── GET /api/auth/discord ─────────────────────────────────────────────────────
// Redirects the user to Discord's OAuth2 authorization page.
router.get('/discord', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId)
        return res.status(503).send('Discord login is not configured (DISCORD_CLIENT_ID missing).');

    // CSRF state token stored in the session
    const state = crypto.randomBytes(20).toString('hex');
    req.session.oauthState = state;

    const redirectUri = buildRedirectUri(req);
    const params = new URLSearchParams({
        client_id:     clientId,
        redirect_uri:  redirectUri,
        response_type: 'code',
        scope:         'identify email',
        state,
        prompt:        'none',
    });

    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// ── GET /api/auth/discord/callback ────────────────────────────────────────────
// Discord redirects here after the user authorises (or denies) access.
router.get('/discord/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.warn('[Auth/Discord] User denied authorization:', error);
        return res.redirect('/?error=discord_denied');
    }

    // Verify CSRF state
    if (!state || state !== req.session.oauthState) {
        console.warn('[Auth/Discord] State mismatch — possible CSRF attempt');
        return res.redirect('/?error=state_mismatch');
    }
    req.session.oauthState = null;

    const clientId     = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    if (!clientId || !clientSecret)
        return res.status(503).send('Discord login is not configured.');

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id:     clientId,
                client_secret: clientSecret,
                grant_type:    'authorization_code',
                code,
                redirect_uri:  buildRedirectUri(req),
            }),
        });

        if (!tokenRes.ok) {
            const body = await tokenRes.text();
            console.error('[Auth/Discord] Token exchange failed:', body);
            return res.redirect('/?error=discord_token');
        }

        const { access_token, token_type } = await tokenRes.json();

        // Fetch Discord user info
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `${token_type} ${access_token}` },
        });

        if (!userRes.ok) {
            console.error('[Auth/Discord] User fetch failed:', userRes.status);
            return res.redirect('/?error=discord_user');
        }

        const discordUser = await userRes.json();

        req.session.user = {
            id:            discordUser.id,
            email:         discordUser.email || null,
            username:      discordUser.username,
            discriminator: discordUser.discriminator,
            avatar:        discordUser.avatar,
            provider:      'discord',
        };

        console.log(`[Auth/Discord] Logged in: ${discordUser.username} (${discordUser.id})`);
        res.redirect('/');
    } catch (err) {
        console.error('[Auth/Discord] Unexpected error:', err.message);
        res.redirect('/?error=discord_error');
    }
});

// ── GET /api/auth/user ────────────────────────────────────────────────────────
router.get('/user', (req, res) => {
    if (!req.session?.user) return res.status(401).json({ message: 'Unauthorized' });
    res.json(req.session.user);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRedirectUri(req) {
    const host  = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    return `${proto}://${host}/api/auth/discord/callback`;
}

module.exports = { router, initAuth };
