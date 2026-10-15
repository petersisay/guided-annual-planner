import { describe, it, expect } from 'vitest';
import { googleAuthSchema } from './auth.schema';
import { userPreferencesSchema } from './user.schema';

describe('Shared Zod Schemas', () => {
  it('validates googleAuthSchema correctly', () => {
    const valid = googleAuthSchema.safeParse({ credential: 'valid_google_token_12345' });
    expect(valid.success).toBe(true);

    const invalid = googleAuthSchema.safeParse({ credential: 'short' });
    expect(invalid.success).toBe(false);

    const missing = googleAuthSchema.safeParse({});
    expect(missing.success).toBe(false);
  });

  it('validates userPreferencesSchema with defaults', () => {
    const result = userPreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weekStart).toBe('monday');
      expect(result.data.weeklyViewDefault).toBe('7day');
      expect(result.data.defaultCurrency).toBe('USD');
      expect(result.data.theme).toBe('paper-warm');
      expect(result.data.prefersReducedMotion).toBe(false);
    }
  });

  it('rejects invalid weekStart option in userPreferencesSchema', () => {
    const result = userPreferencesSchema.safeParse({ weekStart: 'friday' });
    expect(result.success).toBe(false);
  });
});
