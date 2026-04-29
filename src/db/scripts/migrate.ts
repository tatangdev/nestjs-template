import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { env } from '../../common/env.config';
import {
  adminConnection,
  appConnection,
  runScript,
  scriptLogger,
} from './helpers';

const MIGRATIONS_FOLDER = './src/db/migrations';

runScript('migrations', async () => {
  // In dev, create the DB if it doesn't exist so a fresh clone can run `orm:up`.
  if (env.NODE_ENV === 'development') {
    const admin = adminConnection();
    try {
      const exists =
        await admin`SELECT 1 FROM pg_database WHERE datname = ${env.DB_NAME}`;
      if (exists.length === 0) {
        await admin.unsafe(`CREATE DATABASE "${env.DB_NAME}"`);
        scriptLogger.log(`Created database "${env.DB_NAME}".`);
      }
    } finally {
      await admin.end();
    }
  }

  const sql = appConnection();
  try {
    await migrate(drizzle(sql), { migrationsFolder: MIGRATIONS_FOLDER });
    scriptLogger.log('Migrations applied.');
  } finally {
    await sql.end();
  }
});
