import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PwaUpdatePrompt } from './PwaUpdatePrompt';
import * as offlineDb from '../../utils/offlineDb';
import { syncManager } from '../../services/syncManager';
import { editorDirtyTracker } from '../../services/editorDirtyTracker';

describe('PwaUpdatePrompt Component — Unsaved-Edit & Concurrency Protection', () => {
  let unregisterCallbacks: Array<() => void> = [];

  beforeEach(() => {
    vi.restoreAllMocks();
    unregisterCallbacks = [];
  });

  afterEach(() => {
    unregisterCallbacks.forEach((cb) => cb());
    unregisterCallbacks = [];
  });

  it('does not render when registration is null', () => {
    const { container } = render(<PwaUpdatePrompt registration={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders update prompt with accessible labels when a waiting service worker is provided', () => {
    const mockWaitingWorker = {
      postMessage: vi.fn(),
    } as unknown as ServiceWorker;

    const mockRegistration = {
      waiting: mockWaitingWorker,
    } as unknown as ServiceWorkerRegistration;

    render(<PwaUpdatePrompt registration={mockRegistration} />);

    expect(screen.getByRole('region', { name: /Application update available/i })).toBeInTheDocument();
    expect(screen.getByText(/Planner Update Available/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Later/i })).toBeInTheDocument();
  });

  it('allows user to defer update by clicking "Later"', () => {
    const onDismiss = vi.fn();
    const mockRegistration = {
      waiting: { postMessage: vi.fn() },
    } as unknown as ServiceWorkerRegistration;

    render(<PwaUpdatePrompt registration={mockRegistration} onDismiss={onDismiss} />);

    const laterButton = screen.getByRole('button', { name: /Later/i });
    fireEvent.click(laterButton);

    expect(onDismiss).toHaveBeenCalled();
    expect(screen.queryByText(/Planner Update Available/i)).not.toBeInTheDocument();
  });

  it('never triggers automatic update without explicit user button click', () => {
    const postMessage = vi.fn();
    const mockRegistration = {
      waiting: { postMessage },
    } as unknown as ServiceWorkerRegistration;

    render(<PwaUpdatePrompt registration={mockRegistration} />);

    // Assert that postMessage was NOT called passively upon mount
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('blocks update activation and does not reload when an unresolved concurrency conflict exists', async () => {
    const postMessage = vi.fn();
    const mockRegistration = {
      waiting: { postMessage },
    } as unknown as ServiceWorkerRegistration;

    // Simulate an active editor with an unresolved conflict modal
    const unregister = editorDirtyTracker.register({
      id: 'daily-planner-conflict',
      isDirty: () => true,
      hasConflict: () => true,
      flush: vi.fn().mockResolvedValue(false),
    });
    unregisterCallbacks.push(unregister);

    render(<PwaUpdatePrompt registration={mockRegistration} />);

    const updateBtn = screen.getByRole('button', { name: /Update now/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please resolve version conflicts first/i)).toBeInTheDocument();
    });

    // Verify postMessage was NOT called
    expect(postMessage).not.toHaveBeenCalled();
    // Verify "Later" is still available
    expect(screen.getByRole('button', { name: /Later/i })).toBeInTheDocument();
  });

  it('flushes pending editor saves when user typed immediately before clicking "Update now"', async () => {
    const postMessage = vi.fn();
    const mockRegistration = {
      waiting: { postMessage },
    } as unknown as ServiceWorkerRegistration;

    const flushMock = vi.fn().mockResolvedValue(true);

    // Simulate an editor with in-flight or debounced dirty text
    const unregister = editorDirtyTracker.register({
      id: 'reflection-editor-typing',
      isDirty: () => false,
      hasConflict: () => false,
      flush: flushMock,
    });
    unregisterCallbacks.push(unregister);

    render(<PwaUpdatePrompt registration={mockRegistration} />);

    const updateBtn = screen.getByRole('button', { name: /Update now/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(flushMock).toHaveBeenCalled();
      expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });
  });

  it('aborts update and does not reload if flushing pending editor save fails', async () => {
    const postMessage = vi.fn();
    const mockRegistration = {
      waiting: { postMessage },
    } as unknown as ServiceWorkerRegistration;

    const flushMock = vi.fn().mockResolvedValue(false);

    // Simulate editor where flush fails
    const unregister = editorDirtyTracker.register({
      id: 'weekly-editor-save-fail',
      isDirty: () => true,
      hasConflict: () => false,
      flush: flushMock,
    });
    unregisterCallbacks.push(unregister);

    render(<PwaUpdatePrompt registration={mockRegistration} />);

    const updateBtn = screen.getByRole('button', { name: /Update now/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(flushMock).toHaveBeenCalled();
      expect(screen.getByText(/Unsaved edits could not be safely persisted/i)).toBeInTheDocument();
    });

    expect(postMessage).not.toHaveBeenCalled();
  });

  it('allows update when edits were safely persisted to offline IndexedDB', async () => {
    const postMessage = vi.fn();
    const mockRegistration = {
      waiting: { postMessage },
    } as unknown as ServiceWorkerRegistration;

    // Simulate offline save where flush successfully queued to IndexedDB
    const flushMock = vi.fn().mockResolvedValue(true);

    const unregister = editorDirtyTracker.register({
      id: 'offline-journal-editor',
      isDirty: () => false,
      hasConflict: () => false,
      flush: flushMock,
    });
    unregisterCallbacks.push(unregister);

    render(<PwaUpdatePrompt registration={mockRegistration} />);

    const updateBtn = screen.getByRole('button', { name: /Update now/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(flushMock).toHaveBeenCalled();
      expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });
  });

  it('allows clean update activation when all edits are confirmed and no conflicts exist', async () => {
    const postMessage = vi.fn();
    const mockRegistration = {
      waiting: { postMessage },
    } as unknown as ServiceWorkerRegistration;

    render(<PwaUpdatePrompt registration={mockRegistration} />);

    const updateBtn = screen.getByRole('button', { name: /Update now/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });
  });
});
