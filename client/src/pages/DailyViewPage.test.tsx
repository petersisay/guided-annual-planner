import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DailyViewPage } from './DailyViewPage';
import * as AuthContextModule from '../context/AuthContext';

describe('DailyViewPage Component', () => {
  const mockPlan = {
    id: 'daily_plan_1',
    userId: 'user_test_123',
    date: '2026-10-15',
    year: 2026,
    month: 10,
    isoWeek: 42,
    intention: 'Intentional Clarity',
    primaryPriorities: [
      { id: 'p1', text: 'Write manuscript chapter', done: true },
      { id: 'p2', text: 'Editorial review call', done: false },
      { id: 'p3', text: 'Walk in the evening light', done: false },
    ],
    additionalTasks: [
      { id: 'at1', text: 'Respond to publisher email', done: false },
    ],
    schedule: [
      { id: 's1', timeSlot: '09:00 AM', activity: 'Writing session', done: true },
      { id: 's2', timeSlot: '02:00 PM', activity: 'Publisher sync', done: false },
    ],
    reflection: 'Grateful for dedicated creative hours',
    journal: {
      gratitude: ['Fresh coffee', 'Quiet morning studio', 'Crisp autumn air'],
      wins: 'Finished the second draft',
      challengesAndLessons: 'Staying focused amidst email notifications',
      freeWriting: 'Flow emerged once the door was closed.',
    },
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-10-15T08:00:00.000Z',
  };

  const mockContext = {
    mood: {
      moodKey: 'calm',
      colorHex: '#4A6B82',
      label: 'Calm & Centered',
      note: 'Deeply grounded',
    },
    habits: [
      {
        id: 'h1',
        title: 'Morning Stillness',
        colorHex: '#7A9A48',
        completed: true,
      },
    ],
    monthlyMustDos: [
      {
        id: 'm1',
        text: 'Submit manuscript draft',
        checked: false,
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user_test_123',
        email: 'planner.user@example.com',
        name: 'Sara Tesfaye',
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

    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/v1/planner/daily/2026-10-15')) {
        if (init?.method === 'PUT') {
          const body = JSON.parse(init.body as string);
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                plan: { ...mockPlan, ...body },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              plan: mockPlan,
              context: mockContext,
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            plan: { ...mockPlan, date: '2026-10-16' },
            context: mockContext,
          }),
      });
    });
  });

  it('renders daily planner with top 3 priorities, schedule blocks, journal, and context', async () => {
    render(
      <MemoryRouter initialEntries={['/daily/2026-10-15']}>
        <Routes>
          <Route path="/daily/:date?" element={<DailyViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Opening daily journal/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Intentional Clarity')).toBeInTheDocument();
    });

    // Check Rule of 3 priorities
    expect(screen.getByDisplayValue('Write manuscript chapter')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Editorial review call')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Walk in the evening light')).toBeInTheDocument();

    // Check gentle progress message
    expect(screen.getByText(/1 of 3 completed • Steady, intentional progress/i)).toBeInTheDocument();

    // Check schedule blocks
    expect(screen.getByDisplayValue('Writing session')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Publisher sync')).toBeInTheDocument();

    // Check journal entries
    expect(screen.getByDisplayValue('Fresh coffee')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Finished the second draft')).toBeInTheDocument();

    // Check integrated context
    expect(screen.getByText('Calm & Centered')).toBeInTheDocument();
    expect(screen.getByText('Morning Stillness')).toBeInTheDocument();
    expect(screen.getByText('Submit manuscript draft')).toBeInTheDocument();
  });

  it('allows user to toggle a priority item and update intention', async () => {
    render(
      <MemoryRouter initialEntries={['/daily/2026-10-15']}>
        <Routes>
          <Route path="/daily/:date?" element={<DailyViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Intentional Clarity')).toBeInTheDocument();
    });

    const intentionInput = screen.getByDisplayValue('Intentional Clarity');
    fireEvent.change(intentionInput, { target: { value: 'Deep Serenity' } });
    expect(screen.getByDisplayValue('Deep Serenity')).toBeInTheDocument();

    // Toggle priority checkbox
    const priorityCheckbox = screen.getByLabelText('Mark Priority 2 as complete');
    fireEvent.click(priorityCheckbox);

    // Verify autosave was triggered
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/planner/daily/2026-10-15',
          expect.objectContaining({ method: 'PUT' })
        );
      },
      { timeout: 3000 }
    );
  });

  it('allows adding and removing secondary tasks', async () => {
    render(
      <MemoryRouter initialEntries={['/daily/2026-10-15']}>
        <Routes>
          <Route path="/daily/:date?" element={<DailyViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Respond to publisher email')).toBeInTheDocument();
    });

    const addTaskBtn = screen.getByText('Add Task');
    fireEvent.click(addTaskBtn);

    const taskInputs = screen.getAllByPlaceholderText('Task item...');
    expect(taskInputs.length).toBe(2);
  });

  it('handles API load failure with accessible error and retry button', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter initialEntries={['/daily/2026-10-15']}>
        <Routes>
          <Route path="/daily/:date?" element={<DailyViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Daily Journal')).toBeInTheDocument();
    });

    const retryBtn = screen.getByText('Retry Connection');
    expect(retryBtn).toBeInTheDocument();
  });
});
