import { z } from 'zod';

export const googleAuthSchema = z.object({
  credential: z
    .string({
      required_error: 'Google ID token credential is required',
    })
    .min(10, 'Credential string is too short to be a valid JWT'),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
