/**
 * discord-bot/src/db/index.js
 *
 * Standalone PostgreSQL connection for the Discord bot.
 * Uses the `postgres` npm package with raw SQL — no Drizzle ORM, no workspace
 * dependencies. This keeps the bot fully deployable without the monorepo.
 *
 * Tables used (shared with the backend):
 *   button_actions  — custom_id, steps (JSONB), updated_at
 *   sent_messages   — id, channel_id, guild_id, payload, sent_at, sent_by_email
 */

const { makeLogger } = require('../utils/logger');
const log = makeLogger('DB');

let _sql = null;
let _connected = false;

/**
 * Get (or lazily create) the postgres connection pool.
 * Returns null if DATABASE_URL is not set.
 */
function getDb() {
    if (_sql) return _sql;

    const url = process.env.DATABASE_URL;
    if (!url) {
        log.warn('DATABASE_URL not set — running without database');
        return null;
    }

    try {
        const postgres = require('postgres');
        _sql = postgres(url, {
            max:          3,
            idle_timeout: 20,
            connect_timeout: 10,
            onnotice: () => {},
        });
        log.info('Database connection pool created');
        return _sql;
    } catch (err) {
        log.error('Failed to create DB connection:', err.message);
        return null;
    }
}

/**
 * Ping the database with SELECT 1.
 * @returns {Promise<{ ok: boolean, latencyMs: number, error?: string }>}
 */
async function pingDb() {
    const sql = getDb();
    if (!sql) return { ok: false, latencyMs: 0, error: 'DATABASE_URL not set' };

    const start = Date.now();
    try {
        await sql`SELECT 1`;
        _connected = true;
        return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
        _connected = false;
        return { ok: false, latencyMs: Date.now() - start, error: err.message };
    }
}

function isConnected() { return _connected; }

module.exports = { getDb, pingDb, isConnected };
