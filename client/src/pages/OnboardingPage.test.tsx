import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingPage } from './OnboardingPage';
import * as AuthContextModule from '../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('OnboardingPage Component', () => {
  const refreshUserMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user_123',
        name: 'Sara Tesfaye',
        email: 'sara@example.com',
        preferences: {
          weekStart: 'monday',
          weeklyViewDefault: '7day',
          defaultCurrency: 'USD',
          theme: 'paper-warm',
          prefersReducedMotion: false,
          onboardingStatus: 'not_started',
          onboardingStep: 1,
        },
        createdAt: '2026-01-01',
        lastLoginAt: '2026-01-01',
      },
      loading: false,
      error: null,
      loginWithGoogle: vi.fn(),
      loginDev: vi.fn(),
      logout: vi.fn(),
      refreshUser: refreshUserMock,
      clearError: vi.fn(),
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it('renders Step 1 welcome and allows stepping through all 5 steps', async () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    // Step 1: Welcome
    expect(screen.getByText('Welcome to Your Guided Sanctuary')).toBeInTheDocument();
    expect(screen.getByText(/Doing small things before taking major steps/i)).toBeInTheDocument();

    // Move to Step 2
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText(/Anchor Your Year/i)).toBeInTheDocument();

    // Enter Theme and Intention
    const themeInput = screen.getByPlaceholderText(/Clarity, Stillness, Courage/i);
    fireEvent.change(themeInput, { target: { value: 'Steady Growth' } });

    // Move to Step 3
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Personal Rhythm & Preferences')).toBeInTheDocument();

    // Move to Step 4
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('The Daily Rule of 3')).toBeInTheDocument();

    // Move to Step 5
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('You Are Ready')).toBeInTheDocument();

    // Final Completion Action
    const enterBtn = screen.getByText('Enter Planner');
    fireEvent.click(enterBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/user/onboarding',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"status":"completed"'),
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/annual');
    });
  });

  it('allows user to skip onboarding from the top action', async () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    const skipBtn = screen.getByText('Skip to Planner');
    fireEvent.click(skipBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/user/onboarding',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"status":"skipped"'),
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/annual');
    });
  });
});
