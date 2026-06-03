# database

Drizzle ORM schema and migrations for OpenEmbedded.

## Tables

| Table | Purpose |
|-------|---------|
| `button_actions` | Maps Discord component `custom_id` → action steps (replaces in-memory Map) |
| `sent_messages` | Audit log of every message delivered to Discord |
| `sessions` | Admin session audit trail |

## Setup

```bash
# 1. Set your database URL (Replit PostgreSQL, Neon, Supabase, etc.)
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# 2. Generate migrations from schema
yarn workspace database generate

# 3. Apply migrations
yarn workspace database migrate
```

## Development

```bash
# Open Drizzle Studio (visual DB browser)
yarn workspace database studio
```
