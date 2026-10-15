import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { ConflictPayload } from '@planner/shared';

describe('ConflictResolutionModal Component', () => {
  const mockConflict: ConflictPayload = {
    code: 'CONCURRENT_MODIFICATION_CONFLICT',
    message: 'Conflict detected on server',
    conflictReason: 'MODIFIED_ON_SERVER',
    serverVersion: {
      id: 'server-1',
      date: '2026-10-15',
      intention: 'Server intention from phone',
      reflection: 'Server evening reflection',
      journal: {
        wins: 'Server win',
        challengesAndLessons: 'Server lesson',
        freeWriting: 'Server thoughts',
      },
      updatedAt: '2026-10-15T14:00:00.000Z',
    },
  };

  const localData = {
    id: 'local-1',
    date: '2026-10-15',
    intention: 'Local intention from laptop',
    reflection: 'Local evening reflection',
    journal: {
      wins: 'Local win',
      challengesAndLessons: 'Local lesson',
      freeWriting: 'Local thoughts',
    },
    updatedAt: '2026-10-15T12:00:00.000Z',
  };

  it('renders modal when open with both local and server versions', () => {
    render(
      <ConflictResolutionModal
        isOpen={true}
        conflict={mockConflict}
        localData={localData}
        onResolve={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sync Conflict Detected')).toBeInTheDocument();
    expect(screen.getByText('Your Local Version')).toBeInTheDocument();
    expect(screen.getByText('Server Version')).toBeInTheDocument();
    expect(screen.getByText(/Local intention from laptop/i)).toBeInTheDocument();
    expect(screen.getByText(/Server intention from phone/i)).toBeInTheDocument();
  });

  it('calls onResolve with combine strategy and merged reflection by default', async () => {
    const onResolve = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ConflictResolutionModal
        isOpen={true}
        conflict={mockConflict}
        localData={localData}
        onResolve={onResolve}
        onClose={onClose}
      />
    );

    const applyButton = screen.getByRole('button', { name: /Apply Resolution/i });
    await act(async () => {
      fireEvent.click(applyButton);
    });

    expect(onResolve).toHaveBeenCalledWith(
      'combine',
      expect.objectContaining({
        reflection: expect.stringContaining('Merged from other session'),
      })
    );
  });

  it('allows selecting keep_local strategy and applying', async () => {
    const onResolve = vi.fn().mockResolvedValue(undefined);

    render(
      <ConflictResolutionModal
        isOpen={true}
        conflict={mockConflict}
        localData={localData}
        onResolve={onResolve}
        onClose={vi.fn()}
      />
    );

    const keepLocalRadio = screen.getByLabelText(/Keep Local Version/i);
    await act(async () => {
      fireEvent.click(keepLocalRadio);
    });

    const applyButton = screen.getByRole('button', { name: /Apply Resolution/i });
    await act(async () => {
      fireEvent.click(applyButton);
    });

    expect(onResolve).toHaveBeenCalledWith('keep_local', undefined);
  });

  it('allows selecting keep_server strategy and applying', async () => {
    const onResolve = vi.fn().mockResolvedValue(undefined);

    render(
      <ConflictResolutionModal
        isOpen={true}
        conflict={mockConflict}
        localData={localData}
        onResolve={onResolve}
        onClose={vi.fn()}
      />
    );

    const keepServerRadio = screen.getByLabelText(/Keep Server Version/i);
    await act(async () => {
      fireEvent.click(keepServerRadio);
    });

    const applyButton = screen.getByRole('button', { name: /Apply Resolution/i });
    await act(async () => {
      fireEvent.click(applyButton);
    });

    expect(onResolve).toHaveBeenCalledWith('keep_server', undefined);
  });

  it('triggers rescue backup export when requested', () => {
    const onExportRescue = vi.fn();

    render(
      <ConflictResolutionModal
        isOpen={true}
        conflict={mockConflict}
        localData={localData}
        onResolve={vi.fn()}
        onClose={vi.fn()}
        onExportRescueBackup={onExportRescue}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /Download Rescue Backup First/i });
    fireEvent.click(exportBtn);

    expect(onExportRescue).toHaveBeenCalledTimes(1);
  });
});
