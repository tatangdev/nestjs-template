import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { passwordSchema } from '../common/password';
import { WebResponseDto } from '../common/web-response';

export const RegisterSchema = z.object({
  email: z.email().max(255),
  password: passwordSchema,
});

export const VerifyEmailSchema = z.object({
  email: z.email().max(255),
  otp_code: z.string().length(6, 'OTP code must be 6 digits'),
});

export const ResendOtpSchema = z.object({
  email: z.email().max(255),
});

export const LoginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1),
});

export const RefreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export const RegisterResultSchema = z.object({
  user_id: z.uuid(),
  email: z.string(),
  otp_sent: z.boolean(),
  otp_expires_at: z.number(),
});

export const TokenPairSchema = z.object({
  user_id: z.uuid(),
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
});

export const ResendOtpResultSchema = z.object({
  otp_sent: z.boolean(),
  expires_at: z.number(),
  retry_after_seconds: z.number(),
});

export const RefreshResultSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
});

export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailSchema>;
export type ResendOtpRequest = z.infer<typeof ResendOtpSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RefreshRequest = z.infer<typeof RefreshSchema>;
export type RegisterResult = z.infer<typeof RegisterResultSchema>;
export type TokenPair = z.infer<typeof TokenPairSchema>;
export type ResendOtpResult = z.infer<typeof ResendOtpResultSchema>;
export type RefreshResult = z.infer<typeof RefreshResultSchema>;

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}
export class ResendOtpDto extends createZodDto(ResendOtpSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class RefreshDto extends createZodDto(RefreshSchema) {}

export class RegisterResponseDto extends WebResponseDto(RegisterResultSchema) {}
export class TokenPairResponseDto extends WebResponseDto(TokenPairSchema) {}
export class ResendOtpResponseDto extends WebResponseDto(
  ResendOtpResultSchema,
) {}
export class RefreshResponseDto extends WebResponseDto(RefreshResultSchema) {}
