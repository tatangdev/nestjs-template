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
    google_id: varchar('google_id', { length: 255 }),
    facebook_id: varchar('facebook_id', { length: 255 }),
    apple_id: varchar('apple_id', { length: 255 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_idx').on(t.email),
    uniqueIndex('users_google_id_idx').on(t.google_id),
    uniqueIndex('users_facebook_id_idx').on(t.facebook_id),
    uniqueIndex('users_apple_id_idx').on(t.apple_id),
  ],
);

export type User = typeof users.$inferSelect;
