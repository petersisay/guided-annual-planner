import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import * as AuthContextModule from '../context/AuthContext';
import * as LocalStorageModule from '../utils/localStorageBackup';
import { BACKUP_FORMAT_IDENTIFIER, BACKUP_SCHEMA_VERSION } from '@planner/shared';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SettingsPage Component', () => {
  const logoutMock = vi.fn();
  const refreshUserMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user_456',
        name: 'Peter Sisay',
        email: 'peter@example.com',
        avatarUrl: undefined,
        preferences: {
          weekStart: 'monday',
          weeklyViewDefault: '7day',
          defaultCurrency: 'USD',
          theme: 'paper-warm',
          prefersReducedMotion: false,
          onboardingStatus: 'completed',
        },
        createdAt: '2026-01-01',
        lastLoginAt: '2026-01-01',
      },
      loading: false,
      error: null,
      loginWithGoogle: vi.fn(),
      loginDev: vi.fn(),
      logout: logoutMock,
      refreshUser: refreshUserMock,
      clearError: vi.fn(),
    });

    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/backup/export')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({
            'content-disposition': 'attachment; filename="guided-annual-planner-backup-2026-10-15.json"',
          }),
          blob: () => Promise.resolve(new Blob(['{}'], { type: 'application/json' })),
        });
      }

      if (typeof url === 'string' && url.includes('/backup/validate')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              valid: true,
              metadata: {
                format: BACKUP_FORMAT_IDENTIFIER,
                version: BACKUP_SCHEMA_VERSION,
                exportedAt: '2026-10-15T00:00:00.000Z',
                appVersion: '1.0.0',
                counts: {
                  annualPlans: 1,
                  monthlyPlans: 12,
                  weeklyPlans: 52,
                  dailyPlans: 365,
                  moods: 150,
                  habits: 6,
                },
              },
              counts: {
                annualPlans: 1,
                monthlyPlans: 12,
                weeklyPlans: 52,
                dailyPlans: 365,
                moods: 150,
                habits: 6,
              },
              warnings: [],
            }),
        });
      }

      if (typeof url === 'string' && url.includes('/backup/restore')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              mode: 'merge',
              restoredCounts: {
                annualPlans: 1,
                monthlyPlans: 12,
                weeklyPlans: 52,
                dailyPlans: 365,
                moods: 150,
                habits: 6,
              },
              message: 'Non-destructive merge completed successfully.',
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    // Mock URL.createObjectURL and revokeObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-blob');
    window.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  it('renders verified account profile and preferences', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Settings & Backup').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Peter Sisay').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('peter@example.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Your Account')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
  });

  it('allows updating week start preference and saves to server', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const sundayBtn = screen.getByText('Sunday');
    fireEvent.click(sundayBtn);

    const saveBtn = screen.getByText('Save Preferences');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/user/preferences',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"weekStart":"sunday"'),
        })
      );
    });
  });

  it('allows navigating to revisit onboarding', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const revisitBtn = screen.getByText('Open Guided Tour & Tips');
    fireEvent.click(revisitBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('triggers offline local mirror export when requested', () => {
    const exportSpy = vi.spyOn(LocalStorageModule, 'exportJournalAsJsonFile').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const exportBtn = screen.getByText('Save Offline Copy');
    fireEvent.click(exportBtn);

    expect(exportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user_456',
        name: 'Peter Sisay',
        email: 'peter@example.com',
      })
    );
  });

  it('downloads server backup snapshot when requested', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const serverExportBtn = screen.getByText('Download Backup File');
    fireEvent.click(serverExportBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/planner/backup/export',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });
  });

  it('validates, previews, and restores uploaded backup JSON file', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const fileInput = screen.getByTestId('backup-file-input');
    const fakeBackup = {
      metadata: {
        format: BACKUP_FORMAT_IDENTIFIER,
        version: BACKUP_SCHEMA_VERSION,
        exportedAt: '2026-10-15T00:00:00.000Z',
        counts: { annualPlans: 1, monthlyPlans: 12, weeklyPlans: 52, dailyPlans: 365, moods: 150, habits: 6 },
      },
    };

    const file = new File([JSON.stringify(fakeBackup)], 'backup.json', { type: 'application/json' });
    // Provide text() mock for jsdom File
    file.text = () => Promise.resolve(JSON.stringify(fakeBackup));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Backup Verified:/i)).toBeInTheDocument();
      expect(screen.getByText('Daily Notes')).toBeInTheDocument();
      expect(screen.getByText('365')).toBeInTheDocument();
    });

    // Execute Restore
    const restoreBtn = screen.getByText('Restore My Planner Now');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/planner/backup/restore',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"mode":"merge"'),
        })
      );
      expect(refreshUserMock).toHaveBeenCalled();
      expect(screen.getByText('Non-destructive merge completed successfully.')).toBeInTheDocument();
    });
  });

  it('calls logout when sign out is clicked', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const signOutBtns = screen.getAllByText(/log out|sign out/i);
    fireEvent.click(signOutBtns[0]);

    expect(logoutMock).toHaveBeenCalled();
  });
});
