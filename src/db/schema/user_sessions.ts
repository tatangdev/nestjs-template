import { bigint, index, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';
import { users } from './users';

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refresh_token_hash: varchar('refresh_token_hash', { length: 64 }).notNull(),
    user_agent: varchar('user_agent', { length: 500 }),
    ip_address: varchar('ip_address', { length: 45 }),
    expires_at: bigint('expires_at', { mode: 'number' }).notNull(),
    revoked_at: bigint('revoked_at', { mode: 'number' }),
    last_active_at: bigint('last_active_at', { mode: 'number' }),
    ...timestamps,
  },
  (t) => [
    index('user_sessions_user_id_idx').on(t.user_id),
    index('user_sessions_refresh_token_idx').on(t.refresh_token_hash),
  ],
);

export type UserSession = typeof userSessions.$inferSelect;
