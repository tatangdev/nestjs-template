import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import testUser from '../seeds/test-user';
import { appConnection, runScript, scriptLogger } from './helpers';

const target = process.argv[2] ?? 'system';
if (target !== 'system' && target !== 'test') {
  throw new Error(`Unknown seed target "${target}". Use system or test.`);
}

runScript(`${target} seeds`, async () => {
  const sql = appConnection();
  try {
    const db = drizzle(sql, { schema });
    if (target === 'system') {
      // Add system seeds here as the schema grows.
    } else {
      await testUser(db);
    }
    scriptLogger.log('Seeding completed.');
  } finally {
    await sql.end();
  }
});
