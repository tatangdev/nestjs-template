import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),

  RUN_MIGRATIONS: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  LOG_QUERIES: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION_DAYS: z.coerce.number().int().positive().default(7),

  CORS_ORIGINS: z.string().default('*'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  process.stderr.write('Invalid environment variables:\n');
  process.stderr.write(
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2) + '\n',
  );
  process.exit(1);
}

export const env: Env = parsed.data;

export const DATABASE_URL = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
