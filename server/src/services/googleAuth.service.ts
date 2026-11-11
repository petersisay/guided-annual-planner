import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { env } from '../config/env';

export interface VerifiedGoogleUser {
  googleSub: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export class GoogleAuthService {
  private client: OAuth2Client;

  constructor(clientId?: string) {
    this.client = new OAuth2Client(clientId || env.GOOGLE_CLIENT_ID);
  }

  async verifyIdToken(idToken: string): Promise<VerifiedGoogleUser> {
    try {
      const configuredClientId = env.GOOGLE_CLIENT_ID?.trim();
      const isMockClientId =
        !configuredClientId ||
        configuredClientId.startsWith('mock') ||
        configuredClientId.includes('mock_') ||
        configuredClientId.includes('mock-');

      // If GOOGLE_CLIENT_ID is a real client ID, verify audience against it.
      // If GOOGLE_CLIENT_ID is a mock default or unconfigured, allow any token with a valid Google signature.
      const verifyOptions: { idToken: string; audience?: string } = { idToken };
      if (!isMockClientId) {
        verifyOptions.audience = configuredClientId;
      }

      const ticket = await this.client.verifyIdToken(verifyOptions);

      const payload: TokenPayload | undefined = ticket.getPayload();

      if (!payload) {
        const err: any = new Error('Google token payload is empty');
        err.statusCode = 401;
        throw err;
      }

      // Check verified email claim
      if (!payload.email_verified || !payload.email) {
        const err: any = new Error('Google account email is not verified');
        err.statusCode = 401;
        throw err;
      }

      // Check stable subject claim
      if (!payload.sub) {
        const err: any = new Error('Google token missing subject identifier');
        err.statusCode = 401;
        throw err;
      }

      return {
        googleSub: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid Google token';
      console.error('[GoogleAuthService] Token verification failed:', message);
      const authError: any = new Error(`Google authentication failed: ${message}`);
      authError.statusCode = 401;
      authError.code = 'UNAUTHORIZED';
      throw authError;
    }
  }
}

export const googleAuthService = new GoogleAuthService();
