import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { AuthGuard } from './auth.guard';
import { DrizzleService } from './drizzle.service';
import { env } from './env.config';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: env.JWT_ACCESS_EXPIRATION as StringValue },
    }),
  ],
  providers: [DrizzleService, AuthGuard],
  exports: [DrizzleService, AuthGuard, JwtModule],
})
export class CommonModule {}
