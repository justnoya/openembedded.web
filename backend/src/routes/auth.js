const express = require('express');
const crypto   = require('crypto');

const { createToken, consumeToken, pruneExpiredTokens, EXPIRES_MINUTES } = require('../lib/tokens');
const { sendEmail }              = require('../lib/email');
const { verificationEmailHtml }  = require('../lib/emailTemplate');
const { sendWelcomeDm }          = require('../lib/discordDm');
const { userPresence } = require('discord-bot');
const applicationId = process.env.DISCORD_CLIENT_ID;

const router = express.Router();

async function initAuth() {
    pruneExpiredTokens().catch(() => {});
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
// Sends a magic-link verification email. Password field is accepted but ignored
// (the system is passwordless — email-verification only).
router.post('/login', async (req, res) => {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim())
        return res.status(400).json({ error: 'Email is required.' });

    const inputEmail = email.trim().toLowerCase();

    console.log(`[Auth] Login attempt for "${inputEmail}"`);

    const token = await createToken(inputEmail);
    if (!token) {
        // DB unavailable — fall back to instant session login
        console.warn('[Auth] DB unavailable, falling back to direct login');
        req.session.user = { id: inputEmail, email: email.trim(), provider: 'password' };
        return res.json({ ok: true, direct: true });
    }

    const appUrl    = buildAppUrl(req);
    // Link goes to the FRONTEND /verify route, which calls /api/auth/verify via fetch
    const verifyUrl = `${appUrl}/verify?token=${token}`;

    const html = verificationEmailHtml({ verifyUrl, expiresMinutes: EXPIRES_MINUTES });
    const text = [
        'Verify your OpenEmbedded login',
        '',
        'Click the link below to sign in to your account:',
        verifyUrl,
        '',
        `This link expires in ${EXPIRES_MINUTES} minutes and can only be used once.`,
        '',
        "If you didn't request this, you can safely ignore this email.",
        '',
        '© OpenEmbedded',
    ].join('\n');

    const sent = await sendEmail({
        to:      email.trim(),
        subject: 'Verify your OpenEmbedded login',
        html,
        text,
    });

    if (!sent) {
        console.warn('[Auth] Email send failed, falling back to direct login');
        req.session.user = { id: inputEmail, email: email.trim(), provider: 'password' };
        return res.json({ ok: true, direct: true });
    }

    res.json({ ok: true, requiresVerification: true, email: email.trim() });
});

// ── GET /api/auth/verify ──────────────────────────────────────────────────────
// Called via fetch by the frontend (SignIn.tsx) when the user lands on
// /?token=... after clicking the magic-link email. Returns JSON so the
// frontend can show an animated confirmation before navigating.
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
router.post('/resend', async (req, res) => {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string')
        return res.status(400).json({ error: 'Email is required.' });

    const token = await createToken(email.trim().toLowerCase());
    if (!token) return res.status(503).json({ error: 'Service temporarily unavailable.' });

    const appUrl    = buildAppUrl(req);
    const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`;
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
    console.log(`[Auth/Discord] Starting OAuth — redirect_uri: ${redirectUri}`);

    const params = new URLSearchParams({
        client_id:     clientId,
        redirect_uri:  redirectUri,
        response_type: 'code',
        scope:         'identify email guilds',
        state,
        prompt:        'consent',
    });

    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// ── GET /api/auth/discord/callback ────────────────────────────────────────────
router.get('/discord/callback', async (req, res) => {
    const { code, state, error } = req.query;

    const appUrl = buildAppUrl(req);

    if (error) {
        console.warn('[Auth/Discord] User denied authorization:', error);
        return res.redirect(`${appUrl}/?error=discord_denied`);
    }

    if (!state || state !== req.session.oauthState) {
        console.warn('[Auth/Discord] State mismatch — possible CSRF or cookie issue');
        return res.redirect(`${appUrl}/?error=state_mismatch`);
    }
    req.session.oauthState = null;

    const clientId     = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    if (!clientId || !clientSecret)
        return res.status(503).send('Discord login is not configured.');

    // IMPORTANT: redirect_uri in the token exchange MUST exactly match what was
    // used in the authorization URL. We use buildRedirectUri() both times so they
    // are always identical, regardless of which proxy path the request arrived on.
    const redirectUri = buildRedirectUri(req);
    console.log(`[Auth/Discord] Callback — exchanging code, redirect_uri: ${redirectUri}`);

    try {
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id:     clientId,
                client_secret: clientSecret,
                grant_type:    'authorization_code',
                code,
                redirect_uri:  redirectUri,
            }),
        });

        if (!tokenRes.ok) {
            const body = await tokenRes.text();
            console.error('[Auth/Discord] Token exchange failed:', body);
            return res.redirect(`${appUrl}/?error=discord_token`);
        }

        const tokenData = await tokenRes.json();
        const { access_token, token_type } = tokenData;

        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `${token_type} ${access_token}` },
        });

        if (!userRes.ok) {
            console.error('[Auth/Discord] User fetch failed:', userRes.status);
            return res.redirect(`${appUrl}/?error=discord_user`);
        }

        const discordUser = await userRes.json();

        req.session.user = {
            id:                 discordUser.id,
            email:              discordUser.email || null,
            username:           discordUser.username,
            globalName:         discordUser.global_name || discordUser.username,
            discriminator:      discordUser.discriminator,
            avatar:             discordUser.avatar,
            provider:           'discord',
            discordAccessToken: access_token,
        };

        // Set Discord Rich Presence — shows "Playing OpenEmbedded" on their profile
        userPresence.set(discordUser.id, access_token, applicationId).catch(() => {});

        console.log(`[Auth/Discord] Logged in: ${discordUser.username} (${discordUser.id})`);

        // ── Send professional welcome DM via the bot ──────────────────────────
        sendWelcomeDm(discordUser.id, discordUser, req).catch(() => {});

        // Send user to the bot-invite step
        res.redirect(`${appUrl}/?invite_bot=1`);
    } catch (err) {
        console.error('[Auth/Discord] Unexpected error:', err.message);
        res.redirect(`${appUrl}/?error=discord_error`);
    }
});

// ── GET /api/auth/user ────────────────────────────────────────────────────────
router.get('/user', (req, res) => {
    if (!req.session?.user) return res.status(401).json({ message: 'Unauthorized' });
    const { discordAccessToken, ...safeUser } = req.session.user;
    res.json(safeUser);
});

// ── GET /api/auth/guilds ──────────────────────────────────────────────────────
router.get('/guilds', async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ error: 'Unauthorized' });

    const { discordAccessToken, provider } = req.session.user;

    if (provider !== 'discord' || !discordAccessToken) {
        return res.json({ guilds: [], requiresDiscord: true });
    }

    try {
        const r = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: { Authorization: `Bearer ${discordAccessToken}` },
        });

        if (!r.ok) {
            const body = await r.text();
            console.error('[Guilds] Discord API error:', r.status, body);
            return res.status(r.status).json({ error: 'Failed to fetch guilds from Discord.' });
        }

        const allGuilds = await r.json();

        const ADMIN_BIT = 0x8n;
        const adminGuilds = allGuilds.filter(g =>
            g.owner === true || (BigInt(g.permissions || '0') & ADMIN_BIT) !== 0n
        );

        res.json({ guilds: adminGuilds });
    } catch (e) {
        console.error('[Guilds] Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch guilds.' });
    }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    if (req.session?.user?.provider === 'discord' && req.session.user.id) {
        userPresence.clear(req.session.user.id);
    }
    req.session = null;
    res.json({ ok: true });
});

// ── POST /api/auth/presence/refresh ──────────────────────────────────────────
router.post('/presence/refresh', (req, res) => {
    const user = req.session?.user;
    if (!user || user.provider !== 'discord') {
        return res.json({ ok: false, reason: 'not_discord' });
    }
    userPresence.refresh(user.id, applicationId)
        .then(ok => res.json({ ok }))
        .catch(() => res.json({ ok: false }));
});

// ── GET /api/auth/discord/invite ──────────────────────────────────────────────
router.get('/discord/invite', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId)
        return res.status(503).send('DISCORD_CLIENT_ID not configured.');

    const appUrl         = buildAppUrl(req);
    const botCallbackUri = `${appUrl}/api/auth/discord/bot-invited`;

    const params = new URLSearchParams({
        client_id:     clientId,
        permissions:   '8',
        scope:         'bot applications.commands',
        redirect_uri:  botCallbackUri,
        response_type: 'code',
    });

    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// ── GET /api/auth/discord/bot-invited ─────────────────────────────────────────
router.get('/discord/bot-invited', (req, res) => {
    const appUrl  = buildAppUrl(req);
    const guildId = req.query.guild_id;

    if (guildId) {
        console.log(`[Auth/Discord] Bot added to guild: ${guildId}`);
        req.session.botGuildId = guildId;
    } else {
        console.log('[Auth/Discord] Bot invite completed (no guild_id — user may have skipped)');
    }

    res.redirect(`${appUrl}/?discord_connected=1`);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build the OAuth redirect_uri used BOTH when starting the Discord OAuth flow
 * and when exchanging the code for a token. These MUST be identical — Discord
 * validates them and returns an error if they differ.
 *
 * Priority:
 *   1. APP_URL env var (most reliable for production/custom domains)
 *   2. REPLIT_DEV_DOMAIN (always set in Replit — stable across proxy paths)
 *   3. X-Forwarded-Host from reverse proxy
 *   4. req.headers.host (last resort)
 */
function buildRedirectUri(req) {
    return `${_baseUrl(req)}/api/auth/discord/callback`;
}

/**
 * Build the app's public base URL for redirects after OAuth / verify flows.
 * Same priority order as buildRedirectUri so all redirects land on the same origin.
 */
function buildAppUrl(req) {
    return _baseUrl(req);
}

function _baseUrl(req) {
    // 1. Explicit override — most reliable, works for custom domains & production
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');

    // 2. Replit dev domain — always consistent regardless of which internal port
    //    the request arrived on (direct to 3001 vs proxied through Vite 5000)
    if (process.env.REPLIT_DEV_DOMAIN)
        return `https://${process.env.REPLIT_DEV_DOMAIN}`;

    // 3. Forwarded host from a trusted reverse proxy
    const forwardedHost  = req.headers['x-forwarded-host'];
    const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
    if (forwardedHost && !forwardedHost.includes('localhost'))
        return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`;

    // 4. Direct host header
    const host  = req.headers.host || 'localhost:3001';
    const proto = req.secure ? 'https' : 'http';
    return `${proto}://${host}`;
}

module.exports = { router, initAuth };
