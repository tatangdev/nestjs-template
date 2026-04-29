import { Module } from '@nestjs/common';
import { AppleOAuthService } from './apple-oauth.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FacebookOAuthService } from './facebook-oauth.service';
import { GoogleOAuthService } from './google-oauth.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleOAuthService,
    FacebookOAuthService,
    AppleOAuthService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
