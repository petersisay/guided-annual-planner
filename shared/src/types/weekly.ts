// Weekly planner data types — one document per user per ISO week (year + week number)
// Reconstructed from reference images 122758.png (left panel) and 122831.png (right panel)
// ISO 8601 week: week 1 is the week containing the first Thursday, weeks start on Monday

export interface DayTask {
  id: string;
  text: string;
  done: boolean;
}

export interface DayPlan {
  // ISO date for this day (YYYY-MM-DD)
  date: string;
  // Rule of 3: exactly 3 task slots per day
  tasks: [DayTask, DayTask, DayTask];
}

export interface PriorityItem {
  id: string;
  text: string;
  done: boolean;
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  year: number;
  isoWeek: number; // ISO week number (1–53)

  // LEFT PANEL — Daily task lists (Mon–Sun, 7 days)
  days: DayPlan[]; // length 7, indices 0=Mon … 6=Sun

  // RIGHT PANEL
  // PRIORITIES box (5 items)
  priorities: PriorityItem[];

  // REMINDER box (freeform text)
  reminder: string;

  // NEXT WEEK (3 lines)
  nextWeek: string[];

  // NOTES (dot-grid freeform)
  notes: string;

  createdAt: string;
  updatedAt: string;
}
