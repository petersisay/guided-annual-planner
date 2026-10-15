import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WeeklyTaskList } from './WeeklyTaskList';
import { WeeklyNotes } from './WeeklyNotes';
import { DayPlan } from '@planner/shared';

describe('Weekly Spread Components', () => {
  const mockDays: DayPlan[] = [
    {
      date: '2026-01-05',
      tasks: [
        { id: 't1', text: 'Draft specification', done: true },
        { id: 't2', text: 'Review wireframes', done: false },
        { id: 't3', text: 'Team sync', done: false },
      ],
    },
    {
      date: '2026-01-06',
      tasks: [
        { id: 't4', text: 'Implement backend', done: false },
        { id: 't5', text: 'Write tests', done: false },
        { id: 't6', text: 'Evening reflection', done: false },
      ],
    },
    {
      date: '2026-01-07',
      tasks: [
        { id: 't7', text: '', done: false },
        { id: 't8', text: '', done: false },
        { id: 't9', text: '', done: false },
      ],
    },
    {
      date: '2026-01-08',
      tasks: [
        { id: 't10', text: '', done: false },
        { id: 't11', text: '', done: false },
        { id: 't12', text: '', done: false },
      ],
    },
    {
      date: '2026-01-09',
      tasks: [
        { id: 't13', text: '', done: false },
        { id: 't14', text: '', done: false },
        { id: 't15', text: '', done: false },
      ],
    },
    {
      date: '2026-01-10',
      tasks: [
        { id: 't16', text: '', done: false },
        { id: 't17', text: '', done: false },
        { id: 't18', text: '', done: false },
      ],
    },
    {
      date: '2026-01-11',
      tasks: [
        { id: 't19', text: '', done: false },
        { id: 't20', text: '', done: false },
        { id: 't21', text: '', done: false },
      ],
    },
  ];

  it('WeeklyTaskList renders WEEKLY PLANNER, all 7 days, and Rule of 3 tasks', () => {
    const handleUpdateDays = vi.fn();
    render(
      <MemoryRouter>
        <WeeklyTaskList
          days={mockDays}
          onUpdateDays={handleUpdateDays}
          isoWeek={2}
          year={2026}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('WEEKLY PLANNER')).toBeInTheDocument();
    expect(screen.getByText('MONDAY')).toBeInTheDocument();
    expect(screen.getByText('SUNDAY')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Draft specification')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Review wireframes')).toBeInTheDocument();
  });

  it('WeeklyNotes renders PRIORITIES, REMINDER, NEXT WEEK, and Notes sections', () => {
    const handleUpdate = vi.fn();
    render(
      <WeeklyNotes
        priorities={[{ id: 'p1', text: 'Ship Phase 3 redesign', done: false }]}
        reminder="Call coffee supplier on Thursday"
        nextWeek={['Sprint review']}
        notes="Ideas for new habit tracking prompts"
        onUpdate={handleUpdate}
      />
    );

    expect(screen.getByText('PRIORITIES')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ship Phase 3 redesign')).toBeInTheDocument();

    expect(screen.getByText('REMINDER')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Call coffee supplier on Thursday')).toBeInTheDocument();

    expect(screen.getByText('NEXT WEEK')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sprint review')).toBeInTheDocument();

    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ideas for new habit tracking prompts')).toBeInTheDocument();
  });
});
