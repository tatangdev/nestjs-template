import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleOAuthService } from './google-oauth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleOAuthService],
  exports: [AuthService],
})
export class AuthModule {}
