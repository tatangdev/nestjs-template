import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { WebResponseDto } from '../common/web-response';

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  email_verified_at: z.number().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  avatar_url: z.string().nullable(),
  currency: z.string().nullable(),
  marketing_emails: z.boolean(),
  created_at: z.number(),
});

export const UpdateUserSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD')
    .optional(),
  currency: z.string().min(1).max(10).optional(),
  marketing_emails: z.boolean().optional(),
});

export type UserResponse = z.infer<typeof UserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
export class UserResponseDto extends WebResponseDto(UserSchema) {}
