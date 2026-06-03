import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error(
    '[database] DATABASE_URL environment variable is not set.\n' +
    'Set it to your PostgreSQL connection string, e.g.:\n' +
    '  postgresql://user:password@host:5432/dbname'
  );
}

const client = postgres(process.env.DATABASE_URL, { max: 10 });

export const db = drizzle(client, { schema });

export * from './schema.js';
