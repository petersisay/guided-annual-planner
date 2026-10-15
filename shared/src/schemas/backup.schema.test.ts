import { describe, it, expect } from 'vitest';
import { plannerBackupSchema, restoreRequestSchema } from './backup.schema';
import { BACKUP_FORMAT_IDENTIFIER, BACKUP_SCHEMA_VERSION } from '../types/backup';

describe('Planner Backup Zod Schemas', () => {
  const validBackup = {
    metadata: {
      format: BACKUP_FORMAT_IDENTIFIER,
      version: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      counts: {
        annualPlans: 1,
        monthlyPlans: 1,
        weeklyPlans: 1,
        dailyPlans: 1,
        moods: 1,
        habits: 1,
      },
    },
    preferences: {
      weekStart: 'monday' as const,
      weeklyViewDefault: '7day' as const,
      defaultCurrency: 'USD',
      theme: 'paper-warm' as const,
      prefersReducedMotion: false,
    },
    annualPlans: [
      {
        year: 2026,
        themeOrWord: 'Deep Roots',
        annualIntentions: ['Cultivate stillness'],
      },
    ],
    monthlyPlans: [
      {
        year: 2026,
        month: 1,
        mustDos: [{ id: '00000000-0000-0000-0000-000000000001', text: 'Launch chapter 1', checked: false }],
        newHabits: ['Morning reflection'],
        toBuy: [],
        books: [],
      },
    ],
    weeklyPlans: [
      {
        year: 2026,
        isoWeek: 2,
        days: [
          {
            date: '2026-01-05',
            tasks: [
              { id: '00000000-0000-0000-0000-000000000002', text: 'Task 1', done: false },
              { id: '00000000-0000-0000-0000-000000000003', text: 'Task 2', done: false },
              { id: '00000000-0000-0000-0000-000000000004', text: 'Task 3', done: false },
            ],
          },
        ],
        priorities: [],
        nextWeek: [],
      },
    ],
    dailyPlans: [
      {
        date: '2026-01-05',
        year: 2026,
        month: 1,
        isoWeek: 2,
        intention: 'Calm progress',
        primaryPriorities: [
          { id: '00000000-0000-0000-0000-000000000005', text: 'Focus 1', done: false },
          { id: '00000000-0000-0000-0000-000000000006', text: 'Focus 2', done: false },
          { id: '00000000-0000-0000-0000-000000000007', text: 'Focus 3', done: false },
        ],
        additionalTasks: [],
        schedule: [],
        journal: {
          gratitude: ['Quiet morning', 'Hot tea', 'Clear sky'],
          wins: 'Wrote specification',
        },
      },
    ],
    moods: [
      {
        date: '2026-01-05',
        year: 2026,
        moodKey: 'radiant',
        colorHex: '#7A9A48',
        label: 'Radiant',
      },
    ],
    habits: [
      {
        title: 'Morning Stillness',
        colorHex: '#7A9A48',
        activeYear: 2026,
        archived: false,
        completionDates: ['2026-01-05'],
      },
    ],
  };

  it('validates a complete, well-formed backup file correctly', () => {
    const result = plannerBackupSchema.safeParse(validBackup);
    expect(result.success).toBe(true);
  });

  it('rejects unsupported backup formats or versions', () => {
    const invalidFormat = {
      ...validBackup,
      metadata: {
        ...validBackup.metadata,
        format: 'unrecognized-format',
      },
    };
    const res1 = plannerBackupSchema.safeParse(invalidFormat);
    expect(res1.success).toBe(false);

    const invalidVersion = {
      ...validBackup,
      metadata: {
        ...validBackup.metadata,
        version: '99.0.0',
      },
    };
    const res2 = plannerBackupSchema.safeParse(invalidVersion);
    expect(res2.success).toBe(false);
  });

  it('strictly rejects any backup containing forbidden credential keys', () => {
    const contaminated = {
      ...validBackup,
      stolenSessionToken: 'secret_123',
    };
    const res = plannerBackupSchema.safeParse(contaminated);
    expect(res.success).toBe(false);
  });

  it('rejects invalid date formats', () => {
    const invalidDateBackup = {
      ...validBackup,
      moods: [
        {
          date: '05/01/2026', // Invalid format
          year: 2026,
          moodKey: 'calm',
          colorHex: '#7A9A48',
          label: 'Calm',
        },
      ],
    };
    const res = plannerBackupSchema.safeParse(invalidDateBackup);
    expect(res.success).toBe(false);
  });

  it('validates restoreRequestSchema for both merge and replace modes', () => {
    const mergeRequest = {
      mode: 'merge',
      backup: validBackup,
    };
    expect(restoreRequestSchema.safeParse(mergeRequest).success).toBe(true);

    const replaceRequest = {
      mode: 'replace',
      confirmReplace: true,
      backup: validBackup,
    };
    expect(restoreRequestSchema.safeParse(replaceRequest).success).toBe(true);
  });
});
