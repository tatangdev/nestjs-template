import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt } from 'crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { StringValue } from 'ms';
import { DrizzleService } from '../common/drizzle.service';
import { env } from '../common/env.config';
import { notDeleted, otpCodes, userSessions, users } from '../db/schema';
import {
  type LoginRequest,
  type RefreshRequest,
  type RefreshResult,
  type RegisterRequest,
  type RegisterResult,
  type ResendOtpRequest,
  type ResendOtpResult,
  type TokenPair,
  type VerifyEmailRequest,
} from './auth.dto';

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const DEV_OTP_CODE = '000000';

export interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly jwt: JwtService,
  ) {}

  async register(request: RegisterRequest): Promise<RegisterResult> {
    const [existing] = await this.drizzle.db
      .select()
      .from(users)
      .where(and(eq(users.email, request.email), notDeleted(users)));
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(request.password, 10);
    const otpCode = this.generateOtp();
    const otpExpiresAt = Date.now() + OTP_EXPIRY_MS;

    const newUserId = await this.drizzle.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          email: request.email,
          password_hash: passwordHash,
          password_updated_at: Date.now(),
        })
        .returning({ id: users.id });
      if (!created) throw new BadRequestException('Failed to create user');

      await tx.insert(otpCodes).values({
        user_id: created.id,
        identifier: request.email,
        code: otpCode,
        expires_at: otpExpiresAt,
      });

      return created.id;
    });

    this.logger.debug(
      `OTP for ${request.email}: ${otpCode} (dev bypass: ${DEV_OTP_CODE})`,
    );

    return {
      user_id: newUserId,
      email: request.email,
      otp_sent: true,
      otp_expires_at: otpExpiresAt,
    };
  }

  async verifyEmail(
    request: VerifyEmailRequest,
    context?: RequestContext,
  ): Promise<TokenPair> {
    const [existing] = await this.drizzle.db
      .select()
      .from(users)
      .where(and(eq(users.email, request.email), notDeleted(users)));

    if (!existing || existing.email_verified_at) {
      throw new BadRequestException('Invalid verification request');
    }

    await this.validateOtp(request.email, request.otp_code);

    await this.drizzle.db
      .update(users)
      .set({ email_verified_at: Date.now() })
      .where(eq(users.id, existing.id));

    return this.createTokenPair(existing.id, existing.email, context);
  }

  async resendOtp(request: ResendOtpRequest): Promise<ResendOtpResult> {
    const [existing] = await this.drizzle.db
      .select()
      .from(users)
      .where(and(eq(users.email, request.email), notDeleted(users)));

    const otpExpiresAt = Date.now() + OTP_EXPIRY_MS;

    if (!existing || existing.email_verified_at) {
      return {
        otp_sent: true,
        expires_at: otpExpiresAt,
        retry_after_seconds: 60,
      };
    }

    const otpCode = this.generateOtp();
    await this.drizzle.db.insert(otpCodes).values({
      user_id: existing.id,
      identifier: request.email,
      code: otpCode,
      expires_at: otpExpiresAt,
    });

    this.logger.debug(
      `OTP for ${request.email}: ${otpCode} (dev bypass: ${DEV_OTP_CODE})`,
    );

    return {
      otp_sent: true,
      expires_at: otpExpiresAt,
      retry_after_seconds: 60,
    };
  }

  async login(
    request: LoginRequest,
    context?: RequestContext,
  ): Promise<TokenPair> {
    const [existing] = await this.drizzle.db
      .select()
      .from(users)
      .where(and(eq(users.email, request.email), notDeleted(users)));

    if (!existing || !existing.password_hash || !existing.email_verified_at) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(request.password, existing.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.createTokenPair(existing.id, existing.email, context);
  }

  async refresh(request: RefreshRequest): Promise<RefreshResult> {
    const hash = createHash('sha256')
      .update(request.refresh_token)
      .digest('hex');

    const [session] = await this.drizzle.db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.refresh_token_hash, hash),
          isNull(userSessions.revoked_at),
        ),
      )
      .limit(1);

    if (!session || session.expires_at < Date.now()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const [existing] = await this.drizzle.db
      .select()
      .from(users)
      .where(and(eq(users.id, session.user_id), notDeleted(users)));
    if (!existing) throw new UnauthorizedException('User not found');

    const newRefresh = randomBytes(64).toString('hex');
    const newRefreshHash = createHash('sha256')
      .update(newRefresh)
      .digest('hex');
    const newExpiresAt = Date.now() + this.refreshExpiryMs();

    await this.drizzle.db
      .update(userSessions)
      .set({
        refresh_token_hash: newRefreshHash,
        expires_at: newExpiresAt,
        last_active_at: Date.now(),
      })
      .where(eq(userSessions.id, session.id));

    const accessToken = await this.jwt.signAsync(
      { sub: existing.id, email: existing.email, sessionId: session.id },
      { expiresIn: env.JWT_ACCESS_EXPIRATION as StringValue },
    );

    const decoded = this.jwt.decode<{ exp?: number }>(accessToken);

    return {
      access_token: accessToken,
      refresh_token: newRefresh,
      expires_at: (decoded?.exp ?? 0) * 1000,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.drizzle.db
      .update(userSessions)
      .set({ revoked_at: Date.now() })
      .where(eq(userSessions.id, sessionId));
  }

  private generateOtp(): string {
    return String(randomInt(0, 1000000)).padStart(6, '0');
  }

  private async validateOtp(identifier: string, code: string): Promise<void> {
    const [otp] = await this.drizzle.db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.identifier, identifier), isNull(otpCodes.used_at)))
      .orderBy(desc(otpCodes.created_at))
      .limit(1);

    if (!otp)
      throw new BadRequestException('No OTP found. Please request a new one.');
    if (otp.attempts >= OTP_MAX_ATTEMPTS)
      throw new BadRequestException(
        'Maximum attempts exceeded. Request a new code.',
      );
    if (otp.expires_at < Date.now())
      throw new BadRequestException('OTP has expired');

    await this.drizzle.db
      .update(otpCodes)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(otpCodes.id, otp.id));

    const isDevBypass = code === DEV_OTP_CODE;
    if (!isDevBypass && code !== otp.code) {
      throw new BadRequestException('Invalid OTP code');
    }

    await this.drizzle.db
      .update(otpCodes)
      .set({ used_at: Date.now() })
      .where(eq(otpCodes.id, otp.id));
  }

  private refreshExpiryMs(): number {
    return env.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
  }

  private async createTokenPair(
    userId: string,
    email: string,
    context?: RequestContext,
  ): Promise<TokenPair> {
    const refreshToken = randomBytes(64).toString('hex');
    const refreshHash = createHash('sha256').update(refreshToken).digest('hex');

    const [session] = await this.drizzle.db
      .insert(userSessions)
      .values({
        user_id: userId,
        refresh_token_hash: refreshHash,
        user_agent: context?.userAgent ?? null,
        ip_address: context?.ipAddress ?? null,
        expires_at: Date.now() + this.refreshExpiryMs(),
        last_active_at: Date.now(),
      })
      .returning();
    if (!session) throw new BadRequestException('Failed to create session');

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, sessionId: session.id },
      { expiresIn: env.JWT_ACCESS_EXPIRATION as StringValue },
    );
    const decoded = this.jwt.decode<{ exp?: number }>(accessToken);

    return {
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: (decoded?.exp ?? 0) * 1000,
    };
  }
}
