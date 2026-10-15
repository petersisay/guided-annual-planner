import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Bookshelf } from './Bookshelf';
import { BookEntry } from '@planner/shared';

describe('Bookshelf Component - Accessibility and Interaction', () => {
  const sampleBooks: BookEntry[] = [
    {
      id: 'book-1',
      title: 'Atomic Habits',
      author: 'James Clear',
      colorHex: '#7A9A48',
      read: false,
    },
    {
      id: 'book-2',
      title: 'Deep Work',
      author: 'Cal Newport',
      colorHex: '#C85A48',
      read: true,
    },
  ];

  it('renders all 5 book slots with accessible ARIA labels', () => {
    const handleChange = vi.fn();
    render(<Bookshelf books={sampleBooks} onChange={handleChange} />);

    // Slot 1 (filled)
    const slot1 = screen.getByLabelText(/Slot 1, Book: Atomic Habits/i);
    expect(slot1).toBeInTheDocument();
    expect(slot1).toHaveAttribute('tabindex', '0');
    expect(slot1).toHaveAttribute('role', 'button');

    // Slot 2 (completed)
    const slot2 = screen.getByLabelText(/Slot 2, Book: Deep Work.*Completed/i);
    expect(slot2).toBeInTheDocument();

    // Slot 3 (empty)
    const slot3 = screen.getByLabelText(/Empty book slot 3/i);
    expect(slot3).toBeInTheDocument();
  });

  it('opens edit modal on Enter key activation on a book slot', () => {
    const handleChange = vi.fn();
    render(<Bookshelf books={sampleBooks} onChange={handleChange} />);

    const slot1 = screen.getByLabelText(/Slot 1, Book: Atomic Habits/i);
    fireEvent.keyDown(slot1, { key: 'Enter', code: 'Enter' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Atomic Habits')).toBeInTheDocument();
    expect(screen.getByDisplayValue('James Clear')).toBeInTheDocument();
  });

  it('opens edit modal on Space key activation on an empty slot', () => {
    const handleChange = vi.fn();
    render(<Bookshelf books={sampleBooks} onChange={handleChange} />);

    const slot3 = screen.getByLabelText(/Empty book slot 3/i);
    fireEvent.keyDown(slot3, { key: ' ', code: 'Space' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Book to Shelf')).toBeInTheDocument();
  });

  it('closes edit modal when Escape key is pressed', () => {
    const handleChange = vi.fn();
    render(<Bookshelf books={sampleBooks} onChange={handleChange} />);

    const slot1 = screen.getByLabelText(/Slot 1, Book: Atomic Habits/i);
    fireEvent.keyDown(slot1, { key: 'Enter' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toggles read status and triggers onChange with updated state', () => {
    const handleChange = vi.fn();
    render(<Bookshelf books={sampleBooks} onChange={handleChange} />);

    const toggleButton = screen.getByLabelText(/Mark "Atomic Habits" as completed/i);
    fireEvent.click(toggleButton);

    expect(handleChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'book-1', read: true }),
      sampleBooks[1],
    ]);
  });
});
