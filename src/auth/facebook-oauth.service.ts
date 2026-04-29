import { Injectable, UnauthorizedException } from '@nestjs/common';
import { env } from '../common/env.config';

const FETCH_TIMEOUT_MS = 10_000;

export interface FacebookUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface DebugTokenResponse {
  data?: {
    app_id?: string;
    is_valid?: boolean;
    user_id?: string;
  };
}

interface GraphMeResponse {
  id?: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
}

@Injectable()
export class FacebookOAuthService {
  private readonly appId = env.FACEBOOK_APP_ID?.trim() ?? '';
  private readonly appSecret = env.FACEBOOK_APP_SECRET?.trim() ?? '';
  private readonly apiVersion = env.FACEBOOK_API_VERSION;

  isConfigured(): boolean {
    return !!(this.appId && this.appSecret);
  }

  async verifyAccessToken(accessToken: string): Promise<FacebookUserInfo> {
    if (!this.isConfigured()) {
      throw new UnauthorizedException('Facebook OAuth is not configured');
    }

    await this.assertTokenIssuedForApp(accessToken);

    const url =
      `https://graph.facebook.com/${this.apiVersion}/me` +
      `?fields=id,name,email,picture.type(large)`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok)
      throw new UnauthorizedException('Invalid Facebook access token');

    const profile = (await response.json()) as GraphMeResponse;
    if (!profile.id)
      throw new UnauthorizedException('Invalid Facebook token: no user ID');
    if (!profile.email) {
      throw new UnauthorizedException(
        'Facebook account did not share an email — please grant the email permission.',
      );
    }

    return {
      id: profile.id,
      email: profile.email.toLowerCase(),
      name: profile.name ?? profile.email.split('@')[0] ?? 'User',
      picture: profile.picture?.data?.url,
    };
  }

  private async assertTokenIssuedForApp(accessToken: string): Promise<void> {
    const appToken = `${this.appId}|${this.appSecret}`;
    const url =
      `https://graph.facebook.com/${this.apiVersion}/debug_token` +
      `?input_token=${encodeURIComponent(accessToken)}` +
      `&access_token=${encodeURIComponent(appToken)}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok)
      throw new UnauthorizedException('Failed to verify Facebook token');

    const result = (await response.json()) as DebugTokenResponse;
    if (!result.data?.is_valid)
      throw new UnauthorizedException('Facebook token is not valid');
    if (result.data.app_id !== this.appId) {
      throw new UnauthorizedException(
        'Facebook token was not issued for this application',
      );
    }
  }
}
