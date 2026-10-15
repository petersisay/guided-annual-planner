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
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });

      const payload: TokenPayload | undefined = ticket.getPayload();

      if (!payload) {
        throw new Error('Google token payload is empty');
      }

      // Check verified email claim
      if (!payload.email_verified || !payload.email) {
        throw new Error('Google account email is not verified');
      }

      // Check stable subject claim
      if (!payload.sub) {
        throw new Error('Google token missing subject identifier');
      }

      return {
        googleSub: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid Google token';
      throw new Error(`Google authentication failed: ${message}`);
    }
  }
}

export const googleAuthService = new GoogleAuthService();
