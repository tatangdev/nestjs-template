import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { and, eq, isNull } from 'drizzle-orm';
import type { Request } from 'express';
import { DrizzleService } from './drizzle.service';
import { env } from './env.config';
import { notDeleted, userSessions, users, type User } from '../db/schema';

export interface JwtPayload {
  sub: string;
  email?: string;
  sessionId: string;
  exp?: number;
}

export interface AuthedRequest extends Request {
  user: User;
  sessionId: string;
  rawToken: string;
}

export function extractBearerToken(
  authorization: string | undefined,
): string | undefined {
  if (!authorization) return undefined;
  const [type, token] = authorization.split(' ');
  return type === 'Bearer' && token ? token : undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly drizzle: DrizzleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractBearerToken(req.headers.authorization);
    if (!token) throw new UnauthorizedException('Token is required');

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: env.JWT_SECRET,
      });
    } catch (err) {
      if (err instanceof TokenExpiredError)
        throw new UnauthorizedException('Token has expired');
      if (err instanceof JsonWebTokenError)
        throw new UnauthorizedException('Invalid token');
      throw err;
    }

    const [existingUser] = await this.drizzle.db
      .select()
      .from(users)
      .where(and(eq(users.id, payload.sub), notDeleted(users)));
    if (!existingUser) throw new UnauthorizedException('User not found');

    const [session] = await this.drizzle.db
      .select({ id: userSessions.id })
      .from(userSessions)
      .where(
        and(
          eq(userSessions.id, payload.sessionId),
          eq(userSessions.user_id, payload.sub),
          isNull(userSessions.revoked_at),
        ),
      )
      .limit(1);
    if (!session) throw new UnauthorizedException('Session has been revoked');

    req.user = existingUser;
    req.sessionId = payload.sessionId;
    req.rawToken = token;
    return true;
  }
}

export const Auth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User =>
    ctx.switchToHttp().getRequest<AuthedRequest>().user,
);

export const SessionId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest<AuthedRequest>().sessionId,
);
