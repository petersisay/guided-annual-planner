import { UserPreferences } from './user';
import { AnnualReviewData } from './annual';
import { ChecklistItem, BookEntry } from './monthly';
import { DayPlan, PriorityItem, DayTask } from './weekly';
import { ScheduleBlock, DailyJournal } from './daily';

export const BACKUP_FORMAT_IDENTIFIER = 'guided-annual-planner-backup' as const;
export const BACKUP_SCHEMA_VERSION = '1.0.0' as const;

export interface BackupRecordCounts {
  annualPlans: number;
  monthlyPlans: number;
  weeklyPlans: number;
  dailyPlans: number;
  moods: number;
  habits: number;
}

export interface BackupMetadata {
  format: typeof BACKUP_FORMAT_IDENTIFIER;
  version: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string; // ISO 8601
  appVersion: string;
  counts: BackupRecordCounts;
}

export interface BackupAnnualPlan {
  year: number;
  themeOrWord?: string;
  annualIntentions: string[];
  annualReview?: AnnualReviewData;
}

export interface BackupMonthlyPlan {
  year: number;
  month: number;
  mustDos: ChecklistItem[];
  newHabits: string[];
  toBuy: ChecklistItem[];
  books: BookEntry[];
  selfChangeReflection?: string;
  calendarNotes?: Record<string, string>;
}

export interface BackupWeeklyPlan {
  year: number;
  isoWeek: number;
  days: DayPlan[];
  priorities: PriorityItem[];
  reminder?: string;
  nextWeek: string[];
  notes?: string;
}

export interface BackupDailyPlan {
  date: string;
  year: number;
  month: number;
  isoWeek: number;
  intention?: string;
  primaryPriorities: DayTask[];
  additionalTasks: DayTask[];
  schedule: ScheduleBlock[];
  reflection?: string;
  journal: DailyJournal;
}

export interface BackupMoodEntry {
  date: string;
  year: number;
  moodKey: string;
  colorHex: string;
  label: string;
  note?: string;
}

export interface BackupHabit {
  title: string;
  colorHex: string;
  activeYear: number;
  archived?: boolean;
  completionDates: string[]; // List of YYYY-MM-DD date strings
}

export interface PlannerBackupData {
  metadata: BackupMetadata;
  preferences?: UserPreferences;
  annualPlans: BackupAnnualPlan[];
  monthlyPlans: BackupMonthlyPlan[];
  weeklyPlans: BackupWeeklyPlan[];
  dailyPlans: BackupDailyPlan[];
  moods: BackupMoodEntry[];
  habits: BackupHabit[];
}

export type RestoreMode = 'merge' | 'replace';

export interface RestorePreview {
  valid: boolean;
  metadata: BackupMetadata;
  warnings: string[];
  counts: BackupRecordCounts;
}

export interface RestoreResult {
  success: boolean;
  mode: RestoreMode;
  restoredCounts: BackupRecordCounts;
  skippedCounts: Partial<BackupRecordCounts>;
  mergedCounts: Partial<BackupRecordCounts>;
  message: string;
}
