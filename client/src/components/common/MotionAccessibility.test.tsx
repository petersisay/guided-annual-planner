import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GlobalClickAnimation } from './GlobalClickAnimation';
import { GlobalCursorMovement } from './GlobalCursorMovement';

describe('Motion Accessibility Preferences', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('does not spawn ripples on click when prefers-reduced-motion is true', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<GlobalClickAnimation />);
    fireEvent.click(window, { clientX: 100, clientY: 100 });

    const ripples = container.querySelectorAll('.animate-click-ripple');
    expect(ripples.length).toBe(0);
  });

  it('spawns ripples on click when prefers-reduced-motion is false', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<GlobalClickAnimation />);
    fireEvent.click(window, { clientX: 100, clientY: 100 });

    const ripples = container.querySelectorAll('.animate-click-ripple');
    expect(ripples.length).toBe(1);
  });

  it('does not attach mouse listeners if prefers-reduced-motion is true', () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener');

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<GlobalCursorMovement />);
    const mousemoveCalls = addEventSpy.mock.calls.filter(([event]) => event === 'mousemove');
    expect(mousemoveCalls.length).toBe(0);

    addEventSpy.mockRestore();
  });
});
