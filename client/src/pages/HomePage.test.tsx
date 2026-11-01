import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import * as AuthContextModule from '../context/AuthContext';

describe('HomePage Component (Public Landing Page)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders headline, core philosophy, and call-to-actions for guest visitors', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      error: null,
      loginWithGoogle: vi.fn(),
      loginDev: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Headline and brand
    expect(screen.getAllByText('Guided Annual Planner').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Plan with Intention/i)).toBeInTheDocument();

    // Core philosophy quotation
    expect(
      screen.getByText(/Doing small things before taking major steps compounds over time to create a huge impact/i)
    ).toBeInTheDocument();

    // The 4 horizons
    expect(screen.getByText('Annual Vision')).toBeInTheDocument();
    expect(screen.getByText('Monthly Rhythm')).toBeInTheDocument();
    expect(screen.getByText('Weekly 2-Page Spread')).toBeInTheDocument();
    expect(screen.getByText('Daily Focus & Journal')).toBeInTheDocument();

    // Creator story preview and link
    expect(screen.getByText('Peter Sisay')).toBeInTheDocument();
    expect(screen.getByText('Read the Complete Creator Story')).toBeInTheDocument();

    // Unauthenticated CTAs
    expect(screen.getAllByText('Get Started').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('displays Enter Planner and personalized CTA when user is already authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user_123',
        name: 'Peter Sisay',
        email: 'peter@example.com',
        preferences: {
          weekStart: 'monday',
          weeklyViewDefault: '7day',
          defaultCurrency: 'USD',
          theme: 'paper-warm',
          prefersReducedMotion: false,
        },
        createdAt: '2026-01-01',
        lastLoginAt: '2026-01-01',
      },
      loading: false,
      error: null,
      loginWithGoogle: vi.fn(),
      loginDev: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Enter Planner')).toBeInTheDocument();
    expect(screen.getAllByText('Open Your Journal').length).toBeGreaterThanOrEqual(1);
  });

  it('supports opening and closing responsive mobile navigation drawer with accessible attributes', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      error: null,
      loginWithGoogle: vi.fn(),
      loginDev: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Initial state: menu toggle button exists with aria-expanded="false"
    const toggleButton = screen.getByRole('button', { name: /open navigation menu/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('mobile-public-nav')).toBeNull();

    // Click toggle button to open mobile menu
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /close navigation menu/i })).toBeInTheDocument();

    const mobileNav = document.getElementById('mobile-public-nav');
    expect(mobileNav).not.toBeNull();

    // Verify links within drawer
    const drawerPhilosophyLink = mobileNav?.querySelector('a[href="#philosophy"]');
    expect(drawerPhilosophyLink).toBeInTheDocument();

    // Press Escape to dismiss drawer
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(document.getElementById('mobile-public-nav')).toBeNull();

    // Reopen and verify clicking a drawer link closes it
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    expect(document.getElementById('mobile-public-nav')).not.toBeNull();

    const drawerHorizonsLink = document.getElementById('mobile-public-nav')?.querySelector('a[href="#horizons"]');
    if (drawerHorizonsLink) {
      fireEvent.click(drawerHorizonsLink);
    }
    expect(document.getElementById('mobile-public-nav')).toBeNull();
  });
});

