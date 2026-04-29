import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../common/drizzle.service';
import { notDeleted, users, type User } from '../db/schema';
import type { UpdateUserRequest, UserResponse } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly drizzle: DrizzleService) {}

  toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      email_verified_at: user.email_verified_at,
      first_name: user.first_name,
      last_name: user.last_name,
      date_of_birth: user.date_of_birth,
      avatar_url: user.avatar_url,
      currency: user.currency,
      marketing_emails: user.marketing_emails,
      created_at: user.created_at,
    };
  }

  async update(
    userId: string,
    request: UpdateUserRequest,
  ): Promise<UserResponse> {
    const [updated] = await this.drizzle.db
      .update(users)
      .set({ ...request, updated_at: Date.now() })
      .where(and(eq(users.id, userId), notDeleted(users)))
      .returning();
    if (!updated) throw new NotFoundException('User not found');
    return this.toResponse(updated);
  }
}
