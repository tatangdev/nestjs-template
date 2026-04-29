import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { env } from './common/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origin =
    env.CORS_ORIGINS === '*'
      ? true
      : env.CORS_ORIGINS.split(',')
          .map((s) => s.trim())
          .filter(Boolean);
  app.enableCors({ origin, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('App API')
    .setDescription('SvelteKit + NestJS template — API reference')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(document));

  await app.listen(env.PORT);
}
void bootstrap();
