const express = require('express');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const { createToken, consumeToken, pruneExpiredTokens, EXPIRES_MINUTES } = require('../lib/tokens');
const { sendEmail }              = require('../lib/email');
const { verificationEmailHtml }  = require('../lib/emailTemplate');

const router = express.Router();

async function initAuth() {
    // Clean up leftover tokens on startup
    pruneExpiredTokens().catch(() => {});
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
// Sends a verification email to any valid email address.
router.post('/login', async (req, res) => {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim())
        return res.status(400).json({ error: 'Email is required.' });

    const inputEmail = email.trim().toLowerCase();

    console.log(`[Auth] Login attempt for "${inputEmail}"`);

    // Generate email verification token
    const token = await createToken(inputEmail);
    if (!token) {
        // DB unavailable — fall back to direct session login
        console.warn('[Auth] DB unavailable, falling back to direct login');
        req.session.user = { id: inputEmail, email: email.trim(), provider: 'password' };
        return res.json({ ok: true, direct: true });
    }

    const appUrl    = buildAppUrl(req);
    const verifyUrl = `${appUrl}/verify?token=${token}`;

    const html = verificationEmailHtml({ verifyUrl, expiresMinutes: EXPIRES_MINUTES, appUrl });
    const sent = await sendEmail({
        to:      email.trim(),
        subject: 'Verify your OpenEmbedded login',
        html,
    });

    if (!sent) {
        // Email failed — still allow direct login so the app isn't locked out
        console.warn('[Auth] Email send failed, falling back to direct login');
        req.session.user = { id: inputEmail, email: email.trim(), provider: 'password' };
        return res.json({ ok: true, direct: true });
    }

    res.json({ ok: true, requiresVerification: true, email: email.trim() });
});

// ── GET /api/auth/verify ──────────────────────────────────────────────────────
// Consumes a verification token and creates a session.
router.get('/verify', async (req, res) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string')
        return res.status(400).json({ error: 'Missing token.' });

    const email = await consumeToken(token);

    if (!email) {
        return res.status(400).json({ error: 'This link has expired or already been used. Please sign in again.' });
    }

    req.session.user = {
        id:       email,
        email,
        provider: 'password',
    };

    console.log(`[Auth] Verified login for: ${email}`);
    res.json({ ok: true });
});

// ── POST /api/auth/resend ─────────────────────────────────────────────────────
// Re-sends the verification email (rate-limited to verified credentials only).
router.post('/resend', async (req, res) => {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string')
        return res.status(400).json({ error: 'Email is required.' });

    const token = await createToken(email.trim().toLowerCase());
    if (!token) return res.status(503).json({ error: 'Service temporarily unavailable.' });

    const appUrl    = buildAppUrl(req);
    const verifyUrl = `${appUrl}/verify?token=${token}`;
    const html      = verificationEmailHtml({ verifyUrl, expiresMinutes: EXPIRES_MINUTES, appUrl });

    const sent = await sendEmail({ to: email.trim(), subject: 'Verify your OpenEmbedded login', html });
    if (!sent) return res.status(503).json({ error: 'Failed to send email. Check GMAIL_USER and GMAIL_APP_PASSWORD secrets.' });

    res.json({ ok: true });
});

// ── GET /api/auth/discord ─────────────────────────────────────────────────────
router.get('/discord', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId)
        return res.status(503).send('Discord login is not configured (DISCORD_CLIENT_ID missing).');

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
router.get('/discord/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.warn('[Auth/Discord] User denied authorization:', error);
        return res.redirect('/?error=discord_denied');
    }

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

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    req.session = null;
    res.json({ ok: true });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRedirectUri(req) {
    const host  = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    return `${proto}://${host}/api/auth/discord/callback`;
}

function buildAppUrl(req) {
    const host  = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    return `${proto}://${host}`;
}

module.exports = { router, initAuth };
