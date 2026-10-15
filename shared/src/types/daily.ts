import { DayTask } from './weekly';

export interface ScheduleBlock {
  id: string;
  timeSlot: string; // e.g. "08:00 AM", "Morning Focus"
  activity: string;
  done: boolean;
}

export interface DailyTaskItem {
  id: string;
  text: string;
  done: boolean;
}

export interface DailyJournal {
  gratitude: [string, string, string]; // 3 gratitude lines
  wins: string;
  challengesAndLessons: string;
  freeWriting: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string; // Canonical ISO date YYYY-MM-DD
  year: number;
  month: number;
  isoWeek: number;

  // Intention of the day
  intention: string;

  // Rule of 3 Primary Priorities (integrated with the weekly spread)
  primaryPriorities: [DayTask, DayTask, DayTask];

  // Optional additional tasks
  additionalTasks: DailyTaskItem[];

  // Daily Schedule & Time blocks
  schedule: ScheduleBlock[];

  // End of Day Reflection
  reflection: string;

  // Guided Journaling
  journal: DailyJournal;

  createdAt: string;
  updatedAt: string;
}

export interface DailyContext {
  mood?: {
    moodKey?: string;
    colorHex?: string;
    label?: string;
    note?: string;
  } | null;
  habits?: Array<{
    id: string;
    title: string;
    colorHex: string;
    completed: boolean;
  }>;
  monthlyMustDos?: Array<{
    id: string;
    text: string;
    checked: boolean;
  }>;
}

export interface DailyPlanResponse {
  success: boolean;
  plan: DailyPlan;
  context?: DailyContext;
}
