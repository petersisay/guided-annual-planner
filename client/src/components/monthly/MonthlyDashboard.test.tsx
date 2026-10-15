import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthlyDashboard } from './MonthlyDashboard';
import { MonthlyPlan } from '@planner/shared';

describe('MonthlyDashboard Component', () => {
  const mockPlan: MonthlyPlan = {
    id: 'monthly_1',
    userId: 'user_1',
    year: 2026,
    month: 1,
    mustDos: [
      { id: '1', text: 'Renew passport', checked: false },
      { id: '2', text: 'Set annual budget', checked: true },
    ],
    newHabits: ['Meditate 10 mins', 'Daily walk'],
    toBuy: [
      { id: 'tb1', text: 'Fountain pen ink', checked: false },
    ],
    books: [
      { id: 'b1', title: 'Deep Work', colorHex: '#7A9A48', read: true },
    ],
    selfChangeReflection: 'Let go of perfectionism and embrace steady compounding.',
    calendarNotes: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders all 5 core sections matching reference image 122649.png', () => {
    const handleUpdate = vi.fn();
    render(
      <MonthlyDashboard
        plan={mockPlan}
        onUpdate={handleUpdate}
        monthName="January"
        year={2026}
      />
    );

    // 1. MUST DO'S
    expect(screen.getByText("MUST DO'S")).toBeInTheDocument();
    expect(screen.getByDisplayValue('Renew passport')).toBeInTheDocument();

    // 2. NEW HABITS
    expect(screen.getByText('NEW HABITS')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Meditate 10 mins')).toBeInTheDocument();

    // 3. 'TO-BUY
    expect(screen.getByText("'TO-BUY")).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fountain pen ink')).toBeInTheDocument();

    // 4. BOOKS TO READ
    expect(screen.getByText('BOOKS TO READ')).toBeInTheDocument();
    expect(screen.getAllByText('Deep Work').length).toBeGreaterThan(0);

    // 5. WRITE THINGS YOU WANT TO CHANGE ABOUT YOURSELF
    expect(
      screen.getByText(/WRITE THINGS YOU WANT TO CHANGE ABOUT YOURSELF/i)
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(/Let go of perfectionism/i)
    ).toBeInTheDocument();
  });

  it('allows toggling must-do checkboxes', () => {
    const handleUpdate = vi.fn();
    render(
      <MonthlyDashboard
        plan={mockPlan}
        onUpdate={handleUpdate}
        monthName="January"
        year={2026}
      />
    );

    const checkbox = screen.getByLabelText('Must do task 1');
    fireEvent.click(checkbox);
    expect(handleUpdate).toHaveBeenCalled();
  });
});
