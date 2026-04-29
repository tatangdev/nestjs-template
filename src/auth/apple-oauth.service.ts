import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createPublicKey, createVerify } from 'crypto';
import { env } from '../common/env.config';

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_ISSUER = 'https://appleid.apple.com';
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

export interface AppleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AppleJWK {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

interface AppleIdTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  is_private_email?: string | boolean;
}

@Injectable()
export class AppleOAuthService {
  private readonly serviceId = env.APPLE_SERVICE_ID?.trim() ?? '';
  private cachedKeys: AppleJWK[] | null = null;
  private cacheExpiresAt = 0;

  isConfigured(): boolean {
    return !!this.serviceId;
  }

  async verifyIdToken(
    idToken: string,
    userName?: string,
  ): Promise<AppleUserInfo> {
    if (!this.isConfigured()) {
      throw new UnauthorizedException('Apple Sign-In is not configured');
    }

    const [headerB64, payloadB64, signatureB64] = idToken.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new UnauthorizedException('Invalid Apple id_token format');
    }

    const header = JSON.parse(
      Buffer.from(headerB64, 'base64url').toString(),
    ) as {
      kid: string;
      alg: string;
    };

    let key = await this.findKey(header.kid);
    if (!key) {
      // Apple may have rotated keys — invalidate and retry once.
      this.cachedKeys = null;
      key = await this.findKey(header.kid);
      if (!key)
        throw new UnauthorizedException('Apple id_token signing key not found');
    }

    return this.verifyAndExtract(
      headerB64,
      payloadB64,
      signatureB64,
      key,
      userName,
    );
  }

  private verifyAndExtract(
    headerB64: string,
    payloadB64: string,
    signatureB64: string,
    jwk: AppleJWK,
    userName: string | undefined,
  ): AppleUserInfo {
    const publicKey = createPublicKey({
      key: { kty: jwk.kty, n: jwk.n, e: jwk.e },
      format: 'jwk',
    });

    const verifier = createVerify('SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    const ok = verifier.verify(
      publicKey,
      Buffer.from(signatureB64, 'base64url'),
    );
    if (!ok)
      throw new UnauthorizedException('Invalid Apple id_token signature');

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString(),
    ) as AppleIdTokenPayload;

    if (payload.iss !== APPLE_ISSUER) {
      throw new UnauthorizedException('Invalid Apple id_token issuer');
    }
    if (payload.aud !== this.serviceId) {
      throw new UnauthorizedException('Invalid Apple id_token audience');
    }
    if (payload.exp * 1000 < Date.now()) {
      throw new UnauthorizedException('Apple id_token has expired');
    }
    if (!payload.sub)
      throw new UnauthorizedException('Invalid Apple id_token: no user ID');
    if (!payload.email) {
      throw new UnauthorizedException(
        'Apple did not share an email — please grant the email permission.',
      );
    }

    // Apple returns email_verified as the string "true"/"false" or a boolean.
    const verified =
      payload.email_verified === true || payload.email_verified === 'true';
    if (!verified) throw new UnauthorizedException('Apple email not verified');

    return {
      id: payload.sub,
      email: payload.email.toLowerCase(),
      name: userName ?? payload.email.split('@')[0] ?? 'User',
    };
  }

  private async findKey(kid: string): Promise<AppleJWK | undefined> {
    const keys = await this.getApplePublicKeys();
    return keys.find((k) => k.kid === kid);
  }

  private async getApplePublicKeys(): Promise<AppleJWK[]> {
    if (this.cachedKeys && Date.now() < this.cacheExpiresAt) {
      return this.cachedKeys;
    }
    const response = await fetch(APPLE_JWKS_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok)
      throw new UnauthorizedException('Failed to fetch Apple public keys');
    const data = (await response.json()) as { keys: AppleJWK[] };
    this.cachedKeys = data.keys;
    this.cacheExpiresAt = Date.now() + JWKS_CACHE_TTL_MS;
    return data.keys;
  }
}
