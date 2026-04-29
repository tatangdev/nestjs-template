import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { Request } from 'express';
import { AuthGuard, SessionId } from '../common/auth.guard';
import type { WebResponse } from '../common/web-response';
import {
  LoginDto,
  RefreshDto,
  RefreshResponseDto,
  RegisterDto,
  RegisterResponseDto,
  ResendOtpDto,
  ResendOtpResponseDto,
  TokenPairResponseDto,
  VerifyEmailDto,
  type RefreshResult,
  type RegisterResult,
  type ResendOtpResult,
  type TokenPair,
} from './auth.dto';
import { AuthService, type RequestContext } from './auth.service';

function extractContext(req: Request): RequestContext {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress:
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ?? req.socket?.remoteAddress,
  };
}

@ApiTags('Auth')
@Controller('/api/app/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @ZodResponse({ type: RegisterResponseDto })
  async register(
    @Body() body: RegisterDto,
  ): Promise<WebResponse<RegisterResult>> {
    return { data: await this.auth.register(body) };
  }

  @Post('/verify')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: TokenPairResponseDto })
  async verify(
    @Req() req: Request,
    @Body() body: VerifyEmailDto,
  ): Promise<WebResponse<TokenPair>> {
    return { data: await this.auth.verifyEmail(body, extractContext(req)) };
  }

  @Post('/resend-otp')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: ResendOtpResponseDto })
  async resendOtp(
    @Body() body: ResendOtpDto,
  ): Promise<WebResponse<ResendOtpResult>> {
    return { data: await this.auth.resendOtp(body) };
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: TokenPairResponseDto })
  async login(
    @Req() req: Request,
    @Body() body: LoginDto,
  ): Promise<WebResponse<TokenPair>> {
    return { data: await this.auth.login(body, extractContext(req)) };
  }

  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: RefreshResponseDto })
  async refresh(@Body() body: RefreshDto): Promise<WebResponse<RefreshResult>> {
    return { data: await this.auth.refresh(body) };
  }

  @Post('/logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@SessionId() sessionId: string): Promise<void> {
    await this.auth.logout(sessionId);
  }
}
