import { bigint, type PgColumn } from 'drizzle-orm/pg-core';
import { isNull } from 'drizzle-orm';

export const timestamps = {
  created_at: bigint('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
  updated_at: bigint('updated_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now())
    .$onUpdateFn(() => Date.now()),
  deleted_at: bigint('deleted_at', { mode: 'number' }),
};

export const notDeleted = <T extends { deleted_at: PgColumn }>(table: T) =>
  isNull(table.deleted_at);
