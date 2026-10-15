import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getLocalStorageBackup,
  saveAnnualPlanToLocalStorage,
  saveMonthlyPlanToLocalStorage,
  saveWeeklyPlanToLocalStorage,
  clearUserLocalStorageBackup,
  exportJournalAsJsonFile,
  getUserStorageKey,
} from './localStorageBackup';

describe('localStorageBackup Utility - User Separation & Security', () => {
  const userA = { id: 'user_123_alice', name: 'Alice', email: 'alice@example.com' };
  const userB = { id: 'user_456_bob', name: 'Bob', email: 'bob@example.com' };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('does not read or write data if unauthenticated (no userId)', () => {
    const unauthedData = getLocalStorageBackup(undefined);
    expect(unauthedData).toBeNull();

    // Saving without user should be safely ignored
    saveAnnualPlanToLocalStorage(2026, { theme: 'Growth' }, undefined);
    expect(localStorage.length).toBe(0);
  });

  it('stores backups under strictly user-isolated storage keys', () => {
    saveAnnualPlanToLocalStorage(2026, { theme: 'Alice 2026' }, userA);
    saveAnnualPlanToLocalStorage(2026, { theme: 'Bob 2026' }, userB);

    const rawA = localStorage.getItem(getUserStorageKey(userA.id));
    const rawB = localStorage.getItem(getUserStorageKey(userB.id));

    expect(rawA).not.toBeNull();
    expect(rawB).not.toBeNull();

    const backupA = getLocalStorageBackup(userA.id);
    const backupB = getLocalStorageBackup(userB.id);

    expect(backupA?.user.id).toBe(userA.id);
    expect(backupA?.annualPlans['2026']).toEqual({ theme: 'Alice 2026' });

    expect(backupB?.user.id).toBe(userB.id);
    expect(backupB?.annualPlans['2026']).toEqual({ theme: 'Bob 2026' });
  });

  it('prevents user A from seeing user B cached data on account switch', () => {
    saveMonthlyPlanToLocalStorage(2026, 5, { mustDos: ['Secret Project A'] }, userA);

    const bViewOfA = getLocalStorageBackup(userB.id);
    // User B must not see User A's monthly plans
    expect(bViewOfA?.monthlyPlans['2026-5']).toBeUndefined();
  });

  it('clearing one user backup leaves another user backup intact', () => {
    saveWeeklyPlanToLocalStorage(2026, 12, { notes: 'Alice Week 12' }, userA);
    saveWeeklyPlanToLocalStorage(2026, 12, { notes: 'Bob Week 12' }, userB);

    clearUserLocalStorageBackup(userA.id);

    expect(getLocalStorageBackup(userA.id)?.weeklyPlans['2026-12']).toBeUndefined();
    expect(getLocalStorageBackup(userB.id)?.weeklyPlans['2026-12']).toEqual({ notes: 'Bob Week 12' });
  });

  it('produces a distinct export payload with explicit user-requested metadata', () => {
    saveAnnualPlanToLocalStorage(2026, { theme: 'Flourish' }, userA);

    const origCreateElement = document.createElement.bind(document);
    let createdLink: HTMLAnchorElement | null = null;
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName === 'a') {
        createdLink = el as HTMLAnchorElement;
        el.click = vi.fn();
      }
      return el;
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    exportJournalAsJsonFile(userA);

    expect(createdLink).not.toBeNull();
    expect((createdLink as unknown as HTMLAnchorElement).download).toContain('guided-planner-export-alice-');
    expect((createdLink as unknown as HTMLAnchorElement).download).toMatch(/\.json$/);
  });
});
