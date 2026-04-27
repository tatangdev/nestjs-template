import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { CatsModule } from './cats/cats.module';
import { WebResponseExceptionFilter } from './common/web-response.filter';

@Module({
  imports: [CatsModule],
  controllers: [],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: WebResponseExceptionFilter },
  ],
})
export class AppModule {}
