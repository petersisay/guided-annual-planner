export type WeekStartPreference = 'monday' | 'sunday';
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface UserPreferences {
  weekStart: WeekStartPreference;
  weeklyViewDefault: '7day' | '5day';
  defaultCurrency: string;
  theme: 'paper-warm' | 'paper-editorial';
  prefersReducedMotion: boolean;
  onboardingStatus?: OnboardingStatus;
  onboardingStep?: number;
  defaultYear?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  createdAt: string;
  lastLoginAt: string;
}

