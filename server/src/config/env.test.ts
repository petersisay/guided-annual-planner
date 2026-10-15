import { describe, it, expect } from 'vitest';
import { envSchema, parseServerEnv } from './env';

describe('Server Environment Configuration & Production Hardening (env.ts)', () => {
  it('parses valid development configuration with defaults', () => {
    const raw = {
      NODE_ENV: 'development',
    };
    const parsed = envSchema.parse(raw);
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.PORT).toBe(5000);
    expect(parsed.COOKIE_SECURE).toBe(false);
    expect(parsed.COOKIE_NAME).toBe('planner_session');
    expect(parsed.CLIENT_ORIGIN).toBe('http://localhost:5173');
  });

  it('transforms PORT string to number and COOKIE_SECURE string to boolean', () => {
    const raw = {
      NODE_ENV: 'development',
      PORT: '8080',
      COOKIE_SECURE: 'true',
    };
    const parsed = envSchema.parse(raw);
    expect(parsed.PORT).toBe(8080);
    expect(parsed.COOKIE_SECURE).toBe(true);
  });

  it('rejects SESSION_SECRET that is shorter than 32 characters', () => {
    const raw = {
      NODE_ENV: 'development',
      SESSION_SECRET: 'too_short_secret',
    };
    expect(() => envSchema.parse(raw)).toThrow();
  });

  it('allows valid production configuration with custom 32-char secret and COOKIE_SECURE=true', () => {
    const raw = {
      NODE_ENV: 'production',
      SESSION_SECRET: 'production_random_secret_at_least_32_characters_long_for_security',
      COOKIE_SECURE: 'true',
      CLIENT_ORIGIN: 'https://planner.example.com',
    };
    const parsed = envSchema.parse(raw);
    expect(parsed.NODE_ENV).toBe('production');
    expect(parsed.COOKIE_SECURE).toBe(true);
    expect(parsed.SESSION_SECRET).toBe('production_random_secret_at_least_32_characters_long_for_security');
  });

  it('strictly rejects production mode when SESSION_SECRET uses the default development key', () => {
    const raw = {
      NODE_ENV: 'production',
      SESSION_SECRET: 'dev_secret_key_minimum_32_characters_long_for_hmac_sha256',
      COOKIE_SECURE: 'true',
    };
    const result = envSchema.safeParse(raw);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages.some((m) => m.includes('cannot use default development key'))).toBe(true);
    }
  });

  it('strictly rejects production mode when COOKIE_SECURE is false', () => {
    const raw = {
      NODE_ENV: 'production',
      SESSION_SECRET: 'custom_secure_secret_with_more_than_32_characters_here',
      COOKIE_SECURE: 'false',
    };
    const result = envSchema.safeParse(raw);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages.some((m) => m.includes('COOKIE_SECURE must be enabled'))).toBe(true);
    }
  });

  it('parseServerEnv helper throws a clear fatal error on invalid configuration', () => {
    const raw = {
      NODE_ENV: 'production',
      SESSION_SECRET: 'short',
    };
    expect(() => parseServerEnv(raw as any)).toThrow('Invalid environment configuration');
  });
});
