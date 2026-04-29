import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './auth/auth.module';
import { CatsModule } from './cats/cats.module';
import { CommonModule } from './common/common.module';
import { envSchema } from './common/env.config';
import { WebResponseExceptionFilter } from './common/web-response.filter';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (raw) => envSchema.parse(raw),
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    CatsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: WebResponseExceptionFilter },
  ],
})
export class AppModule {}
