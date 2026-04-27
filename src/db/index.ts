import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DATABASE_URL } from '../common/env.config';

const DB_MIGRATING = process.env.DB_MIGRATING === 'true';
const DB_SEEDING = process.env.DB_SEEDING === 'true';

export const connection = postgres(DATABASE_URL, {
  max: DB_MIGRATING || DB_SEEDING ? 1 : undefined,
  onnotice: DB_SEEDING ? () => {} : undefined,
});

export const db = drizzle(connection, { schema });
export type Db = typeof db;
