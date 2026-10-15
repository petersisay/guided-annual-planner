// Monthly planner data types — one document per user per year+month
// Reconstructed from reference image 122649.png (monthly dashboard)
// and 122526.png (monthly calendar grid)

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface BookEntry {
  id: string;
  title: string;
  author?: string;
  colorHex: string; // spine color
  read: boolean;
}

export interface MonthlyPlan {
  id: string;
  userId: string;
  year: number;
  month: number; // 1-indexed (1 = January)

  // MUST DO'S section (6 circle checkboxes)
  mustDos: ChecklistItem[];

  // NEW HABITS section (bullet list)
  newHabits: string[];

  // TO-BUY section (sage green card, circle checkboxes)
  toBuy: ChecklistItem[];

  // BOOKS TO READ section (bookshelf illustration)
  books: BookEntry[];

  // WRITE THINGS YOU WANT TO CHANGE ABOUT YOURSELF (ruled lines)
  selfChangeReflection: string;

  // Monthly calendar cell notes: dateStr (YYYY-MM-DD) -> text
  calendarNotes: Record<string, string>;

  createdAt: string;
  updatedAt: string;
}
