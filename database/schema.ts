import { pgTable, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

// ── Button / component interaction actions ────────────────────────────────────
// Maps a Discord component custom_id → ordered list of action steps.
// This replaces the in-memory `buttonActions` Map in the original server.
export const buttonActions = pgTable('button_actions', {
  customId:  text('custom_id').primaryKey(),
  steps:     jsonb('steps').notNull().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Sent messages audit log ───────────────────────────────────────────────────
// Persists every message delivered to a Discord channel for traceability.
export const sentMessages = pgTable('sent_messages', {
  id:          text('id').primaryKey(),          // Discord message snowflake
  channelId:   text('channel_id').notNull(),
  guildId:     text('guild_id'),
  payload:     jsonb('payload').notNull(),        // full Discord message object
  sentAt:      timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  sentByEmail: text('sent_by_email'),
});

// ── App sessions ──────────────────────────────────────────────────────────────
// Tracks logged-in admin sessions for audit purposes.
// Note: session cookies are still signed with cookie-session; this is the log.
export const sessions = pgTable('sessions', {
  id:        text('id').primaryKey(),
  email:     text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  active:    boolean('active').notNull().default(true),
});

export type ButtonAction  = typeof buttonActions.$inferSelect;
export type SentMessage   = typeof sentMessages.$inferSelect;
export type Session       = typeof sessions.$inferSelect;
