/**
 * backend/src/lib/db.js
 *
 * Drizzle ORM client for the backend.  Mirrors the canonical table definitions
 * in database/schema.ts — keep them in sync when schema changes.
 *
 * Gracefully degrades when DATABASE_URL is not configured: all DB calls
 * become no-ops and the in-memory fallback is used automatically.
 */
const { drizzle }               = require('drizzle-orm/postgres-js');
const postgres                  = require('postgres');
const { pgTable, text, jsonb, timestamp } = require('drizzle-orm/pg-core');
const { eq }                    = require('drizzle-orm');

// ── Table: button_actions ─────────────────────────────────────────────────────
// Maps a Discord component custom_id → ordered list of action steps.
const buttonActions = pgTable('button_actions', {
    customId:  text('custom_id').primaryKey(),
    steps:     jsonb('steps').notNull().$default(() => []),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── DB client (lazy init) ─────────────────────────────────────────────────────
let _db = null;

function getDb() {
    if (_db) return _db;
    if (!process.env.DATABASE_URL) return null;
    try {
        const client = postgres(process.env.DATABASE_URL, { max: 5 });
        _db = drizzle(client);
        return _db;
    } catch (err) {
        console.error('[DB] Failed to connect:', err.message);
        return null;
    }
}

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Load all button actions from the database.
 * Returns a plain object { [customId]: { steps } } matching the in-memory format.
 * Returns {} if DB is unavailable.
 */
async function loadActionsFromDb() {
    const db = getDb();
    if (!db) return {};
    try {
        const rows = await db.select().from(buttonActions);
        const result = {};
        for (const row of rows) {
            result[row.customId] = { steps: row.steps };
        }
        console.log(`[DB] Loaded ${rows.length} button action(s) from database`);
        return result;
    } catch (err) {
        console.warn('[DB] Could not load button actions:', err.message);
        return {};
    }
}

/**
 * Persist all button actions to the database via upsert.
 * actions is { [customId]: { steps } }
 * Silently skips if DB is unavailable.
 */
async function saveActionsToDb(actions) {
    const db = getDb();
    if (!db) return;
    try {
        const entries = Object.entries(actions);
        if (entries.length === 0) return;

        for (const [customId, action] of entries) {
            await db
                .insert(buttonActions)
                .values({ customId, steps: action.steps ?? [] })
                .onConflictDoUpdate({
                    target: buttonActions.customId,
                    set: {
                        steps:     action.steps ?? [],
                        updatedAt: new Date(),
                    },
                });
        }
        console.log(`[DB] Saved ${entries.length} button action(s) to database`);
    } catch (err) {
        console.warn('[DB] Could not save button actions:', err.message);
    }
}

module.exports = { getDb, loadActionsFromDb, saveActionsToDb, buttonActions };
