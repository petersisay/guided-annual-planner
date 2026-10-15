import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JournalLoginCard } from './JournalLoginCard';
import * as AuthContextModule from '../../context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Mock GoogleLogin button from @react-oauth/google
vi.mock('@react-oauth/google', async () => {
  const actual = await vi.importActual<any>('@react-oauth/google');
  return {
    ...actual,
    GoogleLogin: () => <button data-testid="mock-google-login">Sign in with Google</button>,
  };
});

describe('JournalLoginCard Component', () => {
  it('renders warm paper-inspired branding, philosophy, and planner previews', () => {
    // Mock useAuth to return not-loading state
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
      <GoogleOAuthProvider clientId="mock_client_id">
        <JournalLoginCard />
      </GoogleOAuthProvider>
    );

    // Verify Brand & Headline
    expect(screen.getByText(/Guided Annual Planner/i)).toBeInTheDocument();
    expect(screen.getByText(/A sanctuary for intentional living/i)).toBeInTheDocument();

    // Verify Physical Reference Previews
    expect(screen.getByText(/Monthly Bookshelf/i)).toBeInTheDocument();
    expect(screen.getByText(/Annual Habit Heatmap/i)).toBeInTheDocument();

    // Verify Founder Philosophy Quote
    expect(
      screen.getByText(/Doing small things before taking major steps compounds over time/i)
    ).toBeInTheDocument();

    // Verify Google Login Container
    expect(screen.getByTestId('mock-google-login')).toBeInTheDocument();

    // Verify Security Guarantees
    expect(screen.getByText(/Zero third-party tracking or advertising/i)).toBeInTheDocument();
    expect(screen.getByText(/Encrypted database-backed sessions with instant sign-out/i)).toBeInTheDocument();
  });
});
