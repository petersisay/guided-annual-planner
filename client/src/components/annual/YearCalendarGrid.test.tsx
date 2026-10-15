import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { YearCalendarGrid } from './YearCalendarGrid';

describe('YearCalendarGrid Component', () => {
  it('renders all 12 month cards for a common year', () => {
    render(<YearCalendarGrid year={2026} />);

    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('February')).toBeInTheDocument();
    expect(screen.getByText('December')).toBeInTheDocument();
    // February 2026 is not a leap year, so no leap year banner
    expect(screen.queryByText(/Leap Year/i)).not.toBeInTheDocument();
  });

  it('renders 29 days badge in February for a leap year', () => {
    render(<YearCalendarGrid year={2028} />);

    expect(screen.getByText('February')).toBeInTheDocument();
    expect(screen.getByText(/Leap Year • 29 Days/i)).toBeInTheDocument();
  });

  it('calls onDateClick when an active date tile is clicked', () => {
    const handleDateClick = vi.fn();
    render(<YearCalendarGrid year={2026} onDateClick={handleDateClick} />);

    // Find clickable current month buttons
    const day15Button = screen.getByTitle('2026-01-15');
    expect(day15Button).toBeInTheDocument();

    fireEvent.click(day15Button);
    expect(handleDateClick).toHaveBeenCalledWith('2026-01-15');
  });
});
