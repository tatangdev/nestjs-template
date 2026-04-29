import {
  bigint,
  boolean,
  date,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    email_verified_at: bigint('email_verified_at', { mode: 'number' }),
    password_hash: text('password_hash'),
    password_updated_at: bigint('password_updated_at', { mode: 'number' }),
    first_name: varchar('first_name', { length: 100 }),
    last_name: varchar('last_name', { length: 100 }),
    date_of_birth: date('date_of_birth'),
    avatar_url: text('avatar_url'),
    currency: varchar('currency', { length: 10 }),
    marketing_emails: boolean('marketing_emails').default(false).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)],
);

export type User = typeof users.$inferSelect;
