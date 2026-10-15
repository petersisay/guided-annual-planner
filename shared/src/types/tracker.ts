export interface MoodEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  year: number;
  moodKey: string;
  colorHex: string;
  label: string;
  note?: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  colorHex: string;
  activeYear: number;
  archived: boolean;
  completionDates: Record<string, boolean>; // "YYYY-MM-DD" -> true
  createdAt: string;
  updatedAt: string;
}

export interface MoodPaletteOption {
  key: string;
  label: string;
  colorHex: string;
}

export const DEFAULT_MOOD_PALETTE: MoodPaletteOption[] = [
  { key: 'great', label: 'Great / Joyful', colorHex: '#7A9A48' }, // signature sage
  { key: 'peaceful', label: 'Calm / Peaceful', colorHex: '#A2B97E' }, // lighter olive
  { key: 'neutral', label: 'Ordinary / Neutral', colorHex: '#D3CEB6' }, // soft stone
  { key: 'difficult', label: 'Difficult / Stressful', colorHex: '#C85A48' }, // terracotta
  { key: 'down', label: 'Down / Moody', colorHex: '#2F3E46' }, // slate
  { key: 'celebration', label: 'Celebration / Special', colorHex: '#D4A373' }, // warm ochre
];
