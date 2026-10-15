import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
    MONGODB_URI: z.string().default('mongodb://localhost:27017/guided_planner'),
    SESSION_SECRET: z
      .string()
      .min(32, 'SESSION_SECRET must be at least 32 characters long for cryptographic security')
      .default('dev_secret_key_minimum_32_characters_long_for_hmac_sha256'),
    COOKIE_NAME: z.string().default('planner_session'),
    COOKIE_SECURE: z
      .string()
      .default('false')
      .transform((val) => val === 'true'),
    GOOGLE_CLIENT_ID: z.string().default('mock_google_client_id.apps.googleusercontent.com'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (data.SESSION_SECRET === 'dev_secret_key_minimum_32_characters_long_for_hmac_sha256') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SESSION_SECRET cannot use default development key in production mode',
          path: ['SESSION_SECRET'],
        });
      }
      if (!data.COOKIE_SECURE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'COOKIE_SECURE must be enabled (true) in production to enforce HTTPS cookie transmission',
          path: ['COOKIE_SECURE'],
        });
      }
    }
  });

export type ServerEnv = z.infer<typeof envSchema>;

export function parseServerEnv(envInput: NodeJS.ProcessEnv): ServerEnv {
  const parsed = envSchema.safeParse(envInput);
  if (!parsed.success) {
    console.error('Invalid server environment variables:', parsed.error.format());
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

export const env = parseServerEnv(process.env);
