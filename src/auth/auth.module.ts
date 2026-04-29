import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FacebookOAuthService } from './facebook-oauth.service';
import { GoogleOAuthService } from './google-oauth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleOAuthService, FacebookOAuthService],
  exports: [AuthService],
})
export class AuthModule {}
