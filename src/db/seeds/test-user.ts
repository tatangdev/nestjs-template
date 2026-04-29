import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '../schema';
import { scriptLogger, type SeedDb } from '../scripts/helpers';

const EMAIL = 'test@example.com';
const PASSWORD = 'Test1234';

export default async function seed(db: SeedDb): Promise<void> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, EMAIL));
  if (existing) {
    scriptLogger.log(`Test user ${EMAIL} already exists, skipping.`);
    return;
  }

  const now = Date.now();
  await db.insert(users).values({
    email: EMAIL,
    email_verified_at: now,
    password_hash: await bcrypt.hash(PASSWORD, 10),
    password_updated_at: now,
    first_name: 'Test',
    last_name: 'User',
  });
  scriptLogger.log(`Created test user ${EMAIL} (password: ${PASSWORD}).`);
}
