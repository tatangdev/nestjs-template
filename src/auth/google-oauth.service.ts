import { Injectable, UnauthorizedException } from '@nestjs/common';
import { env } from '../common/env.config';

const FETCH_TIMEOUT_MS = 10_000;
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface UserInfoResponse {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly clientId = env.GOOGLE_CLIENT_ID?.trim() ?? '';
  private readonly clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() ?? '';
  private readonly redirectUri = env.GOOGLE_REDIRECT_URI?.trim() ?? '';

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  async exchangeCodeForUserInfo(code: string): Promise<GoogleUserInfo> {
    if (!this.isConfigured()) {
      throw new UnauthorizedException('Google OAuth is not configured');
    }

    const tokens = await this.exchangeCode(code);
    if (!tokens.access_token) {
      throw new UnauthorizedException('Google did not return an access token');
    }
    const info = await this.fetchUserInfo(tokens.access_token);

    if (!info.sub)
      throw new UnauthorizedException('Invalid Google token: no user ID');
    if (!info.email)
      throw new UnauthorizedException('Invalid Google token: email missing');
    if (!info.email_verified)
      throw new UnauthorizedException('Google email not verified');

    return {
      id: info.sub,
      email: info.email.toLowerCase(),
      name: info.name ?? info.email.split('@')[0] ?? 'User',
      picture: info.picture,
    };
  }

  private async exchangeCode(code: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
    });
    if (this.redirectUri) body.set('redirect_uri', this.redirectUri);

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    const data = (await response.json()) as TokenResponse;
    if (!response.ok || data.error) {
      throw new UnauthorizedException(
        data.error_description ??
          'Failed to exchange Google authorization code',
      );
    }
    return data;
  }

  private async fetchUserInfo(accessToken: string): Promise<UserInfoResponse> {
    const response = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok)
      throw new UnauthorizedException('Failed to fetch Google user info');
    return (await response.json()) as UserInfoResponse;
  }
}
