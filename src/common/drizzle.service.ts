import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { DATABASE_URL, env } from './env.config';

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
export type DrizzleTx = Parameters<Parameters<DrizzleDb['transaction']>[0]>[0];

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name);
  private connection!: postgres.Sql;
  public db!: DrizzleDb;

  async onModuleInit() {
    this.connection = postgres(DATABASE_URL, {
      max: 10,
      onnotice: () => {},
    });

    this.db = drizzle(this.connection, {
      schema,
      logger: env.LOG_QUERIES
        ? {
            logQuery: (query, params) => {
              this.logger.debug({ query, params });
            },
          }
        : undefined,
    });

    await this.connection`SELECT 1`;
    this.logger.log('Drizzle ORM connected');
  }

  async onModuleDestroy() {
    await this.connection.end();
    this.logger.log('Drizzle ORM connection closed');
  }
}
