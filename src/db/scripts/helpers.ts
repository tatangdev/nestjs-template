import { createInterface } from 'readline';
import { Logger } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import { DATABASE_URL, env } from '../../common/env.config';
import type * as schema from '../schema';

export type SeedDb = PostgresJsDatabase<typeof schema>;

export const scriptLogger = new Logger('Script');

const PG_OPTS = { max: 1, onnotice: () => {} };
// `postgres` is the cluster's default DB and always exists — used to
// CREATE/DROP our app DB (you can't drop the DB you're connected to).
const ADMIN_URL = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/postgres`;

export const adminConnection = (): Sql => postgres(ADMIN_URL, PG_OPTS);
export const appConnection = (): Sql => postgres(DATABASE_URL, PG_OPTS);

export function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(
      `\x1b[33m⚠ ${message}\x1b[0m \x1b[2m(y/N):\x1b[0m `,
      (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === 'y');
      },
    );
  });
}

export function runScript(label: string, fn: () => Promise<void> | void): void {
  Promise.resolve(fn()).catch((err: unknown) => {
    scriptLogger.error(
      `${label} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  });
}
