import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthlyCalendarGrid } from './MonthlyCalendarGrid';

describe('MonthlyCalendarGrid Component', () => {
  it('renders MONTH header, weekdays, and notes', () => {
    const handleUpdateNotes = vi.fn();
    const notes = {
      '2026-01-15': 'Strategy workshop with team',
    };

    render(
      <MonthlyCalendarGrid
        year={2026}
        month={1}
        calendarNotes={notes}
        onUpdateNotes={handleUpdateNotes}
      />
    );

    expect(screen.getByText(/MONTH 1/i)).toBeInTheDocument();
    expect(screen.getByText('MONDAY')).toBeInTheDocument();
    expect(screen.getByText('SUNDAY')).toBeInTheDocument();
    expect(screen.getByText('Strategy workshop with team')).toBeInTheDocument();
  });
});
