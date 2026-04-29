import {
  bigint,
  index,
  pgTable,
  smallint,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';
import { users } from './users';

export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    code: varchar('code', { length: 6 }).notNull(),
    expires_at: bigint('expires_at', { mode: 'number' }).notNull(),
    used_at: bigint('used_at', { mode: 'number' }),
    attempts: smallint('attempts').default(0).notNull(),
    ...timestamps,
  },
  (t) => [
    index('otp_codes_identifier_idx').on(t.identifier),
    index('otp_codes_user_id_idx').on(t.user_id),
  ],
);

export type OtpCode = typeof otpCodes.$inferSelect;
