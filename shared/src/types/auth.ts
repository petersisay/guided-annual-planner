import { UserProfile } from './user';

export interface GoogleAuthPayload {
  credential: string;
}

export interface AuthResponse {
  success: boolean;
  user: UserProfile;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; issue: string }>;
  };
}
