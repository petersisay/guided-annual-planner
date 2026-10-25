import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AnnualViewPage } from './AnnualViewPage';
import * as AuthContextModule from '../context/AuthContext';

describe('AnnualViewPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user_test_123',
        email: 'planner.user@example.com',
        name: 'Peter Sisay',
        avatarUrl: undefined,
        createdAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: '2026-01-01T00:00:00.000Z',
        preferences: {
          weekStart: 'Monday',
          defaultCurrency: 'USD',
          theme: 'paper',
        },
      },
      loading: false,
      error: null,
      loginWithGoogle: vi.fn(),
      loginDev: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/planner/year')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              plan: {
                id: 'plan_1',
                userId: 'user_test_123',
                year: 2026,
                themeOrWord: 'Deep Roots',
                annualIntentions: ['Cultivate stillness', 'Write daily'],
                annualReview: { celebrations: 'Completed manuscript' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            }),
        });
      }
      if (url.includes('/api/v1/trackers/mood')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, moods: [] }),
        });
      }
      if (url.includes('/api/v1/trackers/habits')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, habits: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }) as any;
  });

  it('renders annual overview header, user name, and year navigation', async () => {
    render(
      <MemoryRouter>
        <AnnualViewPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Guided Annual Planner/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Peter Sisay')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Core Intentions & Commitments')).toBeInTheDocument();
    });
  });

  it('allows navigating between overview, mood, and habit tabs', async () => {
    render(
      <MemoryRouter>
        <AnnualViewPage />
      </MemoryRouter>
    );

    // Initially on Overview
    await waitFor(() => {
      expect(screen.getByText('Annual Horizon', { exact: false })).toBeInTheDocument();
    });

    // Switch to Mood Tracker tab
    const moodTabBtn = screen.getByRole('button', { name: /Daily Mood Tracker/i });
    fireEvent.click(moodTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Daily Mood & Emotion Map/i)).toBeInTheDocument();
    });

    // Switch to Habit Heatmap tab
    const habitsTabBtn = screen.getByRole('button', { name: /Habits Tracker/i });
    fireEvent.click(habitsTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Daily Habit Consistency Map/i)).toBeInTheDocument();
    });
  }, 15000);

  it('navigates years and indicates leap years accurately', async () => {
    render(
      <MemoryRouter>
        <AnnualViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('2026')).toBeInTheDocument();
    });

    // Find the next year button
    const nextBtn = screen.getByTitle('Next Year');

    // Click to 2027
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(screen.getByText('2027')).toBeInTheDocument();
    });

    // Click to 2028 (leap year)
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(screen.getByText('2028')).toBeInTheDocument();
      expect(screen.getByText('Leap Year (366 Days)')).toBeInTheDocument();
    });
  });
});
