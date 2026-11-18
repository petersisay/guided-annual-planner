import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App Root Component - Google Client ID Configuration Guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders MissingGoogleConfigCard when VITE_GOOGLE_CLIENT_ID is absent or blank', () => {
    // Ensure import.meta.env.VITE_GOOGLE_CLIENT_ID is undefined or empty
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');

    render(<App />);

    expect(screen.getByText(/Google Client ID Required/i)).toBeInTheDocument();
    expect(screen.getByText(/client\/\.env/i)).toBeInTheDocument();
    expect(screen.getByText(/VITE_GOOGLE_CLIENT_ID/i)).toBeInTheDocument();
  });
});
