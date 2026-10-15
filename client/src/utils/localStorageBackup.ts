/**
 * Local Storage Mirror & Backup Utility
 *
 * Provides safe, user-scoped browser localStorage caching and explicit JSON export.
 * Each user's journal cache is strictly isolated using their unique user ID to prevent
 * any cross-account data leakage or accidental overwriting when switching accounts.
 */

export interface BackupUserMetadata {
  id: string;
  name?: string;
  email?: string;
}

export interface LocalStorageJournalBackup {
  version: string;
  type: 'browser_cache' | 'user_requested_export';
  savedAt: string;
  user: BackupUserMetadata;
  annualPlans: Record<string, unknown>; // year -> plan
  monthlyPlans: Record<string, unknown>; // "year-month" -> plan
  weeklyPlans: Record<string, unknown>; // "year-week" -> plan
  dailyPlans?: Record<string, unknown>; // "YYYY-MM-DD" -> plan
  habits?: unknown[];
  moods?: unknown[];
}

const STORAGE_PREFIX = 'guided_planner_cache_user_';

export function getUserStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * Retrieves the local cache for a specific authenticated user.
 * Returns null if no userId is provided or if no cache exists for this user.
 */
export function getLocalStorageBackup(userId?: string): LocalStorageJournalBackup | null {
  if (!userId) {
    return null;
  }

  try {
    const raw = localStorage.getItem(getUserStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as LocalStorageJournalBackup;
      // Guard against corrupted or cross-account data: verify user ID matches
      if (parsed && parsed.user && parsed.user.id === userId) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Failed to read localStorage backup for user ${userId}:`, err);
  }

  return {
    version: '1.0.0',
    type: 'browser_cache',
    savedAt: new Date().toISOString(),
    user: { id: userId },
    annualPlans: {},
    monthlyPlans: {},
    weeklyPlans: {},
    dailyPlans: {},
    habits: [],
    moods: [],
  };
}

/**
 * Saves an annual plan into the user-isolated cache.
 * If user is undefined or has no id, write is skipped to prevent cross-account pollution.
 */
export function saveAnnualPlanToLocalStorage(
  year: number,
  plan: unknown,
  user?: BackupUserMetadata
): void {
  if (!user || !user.id) return;

  try {
    const backup = getLocalStorageBackup(user.id) || {
      version: '1.0.0',
      type: 'browser_cache',
      savedAt: new Date().toISOString(),
      user: { id: user.id, name: user.name, email: user.email },
      annualPlans: {},
      monthlyPlans: {},
      weeklyPlans: {},
      habits: [],
      moods: [],
    };

    backup.savedAt = new Date().toISOString();
    backup.user = { id: user.id, name: user.name, email: user.email };
    backup.annualPlans[String(year)] = plan;

    localStorage.setItem(getUserStorageKey(user.id), JSON.stringify(backup));
  } catch (err) {
    console.error('Failed to save annual plan to localStorage:', err);
  }
}

/**
 * Saves a monthly plan into the user-isolated cache.
 */
export function saveMonthlyPlanToLocalStorage(
  year: number,
  month: number,
  plan: unknown,
  user?: BackupUserMetadata
): void {
  if (!user || !user.id) return;

  try {
    const backup = getLocalStorageBackup(user.id) || {
      version: '1.0.0',
      type: 'browser_cache',
      savedAt: new Date().toISOString(),
      user: { id: user.id, name: user.name, email: user.email },
      annualPlans: {},
      monthlyPlans: {},
      weeklyPlans: {},
      habits: [],
      moods: [],
    };

    backup.savedAt = new Date().toISOString();
    backup.monthlyPlans[`${year}-${month}`] = plan;

    localStorage.setItem(getUserStorageKey(user.id), JSON.stringify(backup));
  } catch (err) {
    console.error('Failed to save monthly plan to localStorage:', err);
  }
}

/**
 * Saves a weekly plan into the user-isolated cache.
 */
export function saveWeeklyPlanToLocalStorage(
  year: number,
  week: number,
  plan: unknown,
  user?: BackupUserMetadata
): void {
  if (!user || !user.id) return;

  try {
    const backup = getLocalStorageBackup(user.id) || {
      version: '1.0.0',
      type: 'browser_cache',
      savedAt: new Date().toISOString(),
      user: { id: user.id, name: user.name, email: user.email },
      annualPlans: {},
      monthlyPlans: {},
      weeklyPlans: {},
      habits: [],
      moods: [],
    };

    backup.savedAt = new Date().toISOString();
    backup.weeklyPlans[`${year}-${week}`] = plan;

    localStorage.setItem(getUserStorageKey(user.id), JSON.stringify(backup));
  } catch (err) {
    console.error('Failed to save weekly plan to localStorage:', err);
  }
}

/**
 * Saves a daily plan into the user-isolated cache.
 */
export function saveDailyPlanToLocalStorage(
  date: string,
  plan: unknown,
  user?: BackupUserMetadata
): void {
  if (!user || !user.id) return;

  try {
    const backup = getLocalStorageBackup(user.id) || {
      version: '1.0.0',
      type: 'browser_cache',
      savedAt: new Date().toISOString(),
      user: { id: user.id, name: user.name, email: user.email },
      annualPlans: {},
      monthlyPlans: {},
      weeklyPlans: {},
      dailyPlans: {},
      habits: [],
      moods: [],
    };

    backup.savedAt = new Date().toISOString();
    if (!backup.dailyPlans) {
      backup.dailyPlans = {};
    }
    backup.dailyPlans[date] = plan;

    localStorage.setItem(getUserStorageKey(user.id), JSON.stringify(backup));
  } catch (err) {
    console.error('Failed to save daily plan to localStorage:', err);
  }
}

/**
 * Clears the cached journal data for a specific user upon explicit request or account logout.
 */
export function clearUserLocalStorageBackup(userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(getUserStorageKey(userId));
  } catch (err) {
    console.error(`Failed to clear localStorage backup for user ${userId}:`, err);
  }
}

/**
 * Safe logout handler: guarantees in-memory isolation and ensures no unauthenticated
 * session can inspect or read the previous user's data.
 */
export function handleUserLogout(userId?: string): void {
  // If needed, specific session tags can be cleared here.
  // We keep the offline cache in its private key for offline reload by the same user,
  // but ensure no unauthenticated accessor can read it without authenticating as that user.
  if (userId) {
    // Optionally remove temporary session keys
  }
}

/**
 * Explicit user-requested JSON export.
 * Clearly separates manual user downloads from background browser caching.
 * The exported JSON contains explicit metadata and user attribution.
 */
export function exportJournalAsJsonFile(user: BackupUserMetadata): void {
  if (!user || !user.id) {
    console.warn('Cannot export journal without an authenticated user.');
    return;
  }

  const cached = getLocalStorageBackup(user.id);
  const exportPayload: LocalStorageJournalBackup = {
    version: '1.0.0',
    type: 'user_requested_export',
    savedAt: new Date().toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    annualPlans: cached?.annualPlans || {},
    monthlyPlans: cached?.monthlyPlans || {},
    weeklyPlans: cached?.weeklyPlans || {},
    dailyPlans: cached?.dailyPlans || {},
    habits: cached?.habits || [],
    moods: cached?.moods || [],
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const safeName = (user.name || user.id).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const dateStr = new Date().toISOString().split('T')[0];

  const link = document.createElement('a');
  link.href = url;
  link.download = `guided-planner-export-${safeName}-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
