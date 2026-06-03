/**
 * backend/src/lib/tokens.js
 *
 * Verification token helpers — create, consume, and clean up tokens in the DB.
 */
const crypto   = require('crypto');
const postgres = require('postgres');

let _sql = null;

function getSql() {
    if (_sql) return _sql;
    if (!process.env.DATABASE_URL) return null;
    _sql = postgres(process.env.DATABASE_URL, { max: 3 });
    return _sql;
}

const EXPIRES_MINUTES = 30;

/**
 * Generate a new verification token for the given email.
 * Deletes any previous unused tokens for that email first.
 * Returns the token string, or null if DB is unavailable.
 */
async function createToken(email) {
    const sql = getSql();
    if (!sql) return null;

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000);

    try {
        // Remove old unused tokens for this email
        await sql`DELETE FROM verification_tokens WHERE email = ${email} AND used = FALSE`;

        await sql`
            INSERT INTO verification_tokens (token, email, expires_at)
            VALUES (${token}, ${email}, ${expiresAt})
        `;
        return token;
    } catch (err) {
        console.error('[Tokens] Failed to create token:', err.message);
        return null;
    }
}

/**
 * Consume a token. Returns the email on success, null if invalid/expired/used.
 */
async function consumeToken(token) {
    const sql = getSql();
    if (!sql) return null;

    try {
        const rows = await sql`
            SELECT email, expires_at, used
            FROM verification_tokens
            WHERE token = ${token}
            LIMIT 1
        `;

        if (rows.length === 0)       return null;  // not found
        if (rows[0].used)            return null;  // already used
        if (new Date() > new Date(rows[0].expires_at)) return null;  // expired

        // Mark as used
        await sql`UPDATE verification_tokens SET used = TRUE WHERE token = ${token}`;

        return rows[0].email;
    } catch (err) {
        console.error('[Tokens] Failed to consume token:', err.message);
        return null;
    }
}

/**
 * Delete all expired tokens (call this periodically or on startup).
 */
async function pruneExpiredTokens() {
    const sql = getSql();
    if (!sql) return;
    try {
        await sql`DELETE FROM verification_tokens WHERE expires_at < NOW()`;
    } catch (err) {
        console.warn('[Tokens] Prune failed:', err.message);
    }
}

module.exports = { createToken, consumeToken, pruneExpiredTokens, EXPIRES_MINUTES };
