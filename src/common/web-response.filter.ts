import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import type { Response } from 'express';
import { z } from 'zod';
import type { WebResponse } from './web-response';

@Catch()
export class WebResponseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WebResponseExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    const { status, message } = this.normalize(exception);
    const body: WebResponse<never> = { errors: message };
    res.status(status).json(body);
  }

  private normalize(exception: unknown): { status: number; message: string } {
    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      if (zodError instanceof z.ZodError) {
        const message = zodError.issues
          .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
          .join('; ');
        return { status: HttpStatus.BAD_REQUEST, message };
      }
      return { status: HttpStatus.BAD_REQUEST, message: 'Validation failed' };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : ((response as { message?: string | string[] })?.message ??
            exception.message);
      return {
        status,
        message: Array.isArray(message) ? message.join('; ') : message,
      };
    }

    this.logger.error(exception);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
