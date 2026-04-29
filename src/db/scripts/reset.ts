import { env } from '../../common/env.config';
import { adminConnection, confirm, runScript, scriptLogger } from './helpers';

runScript('reset', async () => {
  const ok = await confirm(
    `This will DROP database "${env.DB_NAME}" on ${env.DB_HOST}:${env.DB_PORT}. Are you sure?`,
  );
  if (!ok) {
    scriptLogger.log('Reset cancelled.');
    return;
  }

  const admin = adminConnection();
  try {
    // Kill lingering sessions so DROP DATABASE doesn't fail.
    await admin`
      SELECT pg_terminate_backend(pid) FROM pg_stat_activity
      WHERE datname = ${env.DB_NAME} AND pid <> pg_backend_pid()
    `;
    await admin.unsafe(`DROP DATABASE IF EXISTS "${env.DB_NAME}"`);
    scriptLogger.log(`Dropped database "${env.DB_NAME}".`);
  } finally {
    await admin.end();
  }
});
