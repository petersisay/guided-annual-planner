import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncManager } from './syncManager';
import * as offlineDb from '../utils/offlineDb';
import { OfflineMutation } from '@planner/shared';

describe('SyncManager Service', () => {
  const userId = 'user-sync-test';
  let mockMutations: OfflineMutation[] = [];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockMutations = [];

    vi.spyOn(offlineDb, 'getPendingMutations').mockImplementation(async (uid: string) => {
      return mockMutations.filter((m) => m.userId === uid && m.status !== 'conflict');
    });

    vi.spyOn(offlineDb, 'getPendingMutationsCount').mockImplementation(async (uid: string) => {
      return mockMutations.filter((m) => m.userId === uid).length;
    });

    vi.spyOn(offlineDb, 'updateMutation').mockImplementation(async (id: string, updates: any) => {
      const idx = mockMutations.findIndex((m) => m.id === id);
      if (idx !== -1) {
        mockMutations[idx] = { ...mockMutations[idx], ...updates };
      }
    });

    vi.spyOn(offlineDb, 'deleteMutation').mockImplementation(async (id: string) => {
      mockMutations = mockMutations.filter((m) => m.id !== id);
    });

    vi.spyOn(offlineDb, 'saveCachedRecord').mockResolvedValue(undefined);

    // Mock navigator.onLine as true
    vi.stubGlobal('navigator', { onLine: true });

    syncManager.setActiveUser(userId);
  });

  afterEach(() => {
    syncManager.setActiveUser(null);
  });

  it('initializes and reports initial synced status when queue is empty', () => {
    expect(syncManager.getSyncStatus()).toBe('synced');
  });

  it('syncs pending mutation online with X-Mutation-Id header', async () => {
    const testMutation: OfflineMutation = {
      id: 'mut-1234-uuid',
      userId,
      entityType: 'daily',
      entityKey: '2026-10-15',
      endpoint: '/api/v1/planner/daily/2026-10-15',
      method: 'PUT',
      payload: { intention: 'Morning sunlight' },
      expectedUpdatedAt: '2026-10-15T08:00:00.000Z',
      createdAt: Date.now(),
      retryCount: 0,
      status: 'pending',
    };
    mockMutations.push(testMutation);

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        plan: {
          id: 'p-1',
          date: '2026-10-15',
          intention: 'Morning sunlight',
          updatedAt: '2026-10-15T09:00:00.000Z',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    await syncManager.syncPending();

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/planner/daily/2026-10-15',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'X-Mutation-Id': 'mut-1234-uuid',
          'X-Planner-Client': 'WebApp',
        }),
      })
    );

    // Mutation should be deleted from queue upon success
    expect(mockMutations).toHaveLength(0);
    expect(syncManager.getSyncStatus()).toBe('synced');
  });

  it('detects 409 conflict, pauses sync, and dispatches conflict event', async () => {
    const testMutation: OfflineMutation = {
      id: 'mut-conflict-uuid',
      userId,
      entityType: 'daily',
      entityKey: '2026-10-15',
      endpoint: '/api/v1/planner/daily/2026-10-15',
      method: 'PUT',
      payload: { intention: 'Local device note' },
      expectedUpdatedAt: '2026-10-15T07:00:00.000Z',
      createdAt: Date.now(),
      retryCount: 0,
      status: 'pending',
    };
    mockMutations.push(testMutation);

    const conflictListener = vi.fn();
    syncManager.onConflict(conflictListener);

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: {
          code: 'CONCURRENT_MODIFICATION_CONFLICT',
          message: 'Plan modified on another device',
          conflictReason: 'MODIFIED_ON_SERVER',
          serverVersion: {
            id: 'p-1',
            date: '2026-10-15',
            intention: 'Server newer note',
            updatedAt: '2026-10-15T12:00:00.000Z',
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    await syncManager.syncPending();

    expect(syncManager.getSyncStatus()).toBe('conflict');
    expect(conflictListener).toHaveBeenCalledWith(
      expect.objectContaining({
        mutation: expect.objectContaining({ id: 'mut-conflict-uuid' }),
        payload: expect.objectContaining({
          code: 'CONCURRENT_MODIFICATION_CONFLICT',
        }),
      })
    );
  });

  it('resolves conflict with keep_local strategy by updating mutation and re-syncing', async () => {
    const mutationId = 'mut-to-resolve';
    mockMutations.push({
      id: mutationId,
      userId,
      entityType: 'daily',
      entityKey: '2026-10-15',
      endpoint: '/api/v1/planner/daily/2026-10-15',
      method: 'PUT',
      payload: { intention: 'User wants local' },
      createdAt: Date.now(),
      retryCount: 0,
      status: 'conflict',
    });

    const updateSpy = vi.spyOn(offlineDb, 'updateMutation');

    await syncManager.resolveConflict(mutationId, 'keep_local');

    expect(updateSpy).toHaveBeenCalledWith(
      mutationId,
      expect.objectContaining({
        status: 'pending',
        expectedUpdatedAt: undefined,
      })
    );
  });

  it('resolves conflict with keep_server strategy by discarding local mutation', async () => {
    const mutationId = 'mut-discard-local';
    mockMutations.push({
      id: mutationId,
      userId,
      entityType: 'daily',
      entityKey: '2026-10-15',
      endpoint: '/api/v1/planner/daily/2026-10-15',
      method: 'PUT',
      payload: { intention: 'Discard me' },
      createdAt: Date.now(),
      retryCount: 0,
      status: 'conflict',
    });

    const deleteSpy = vi.spyOn(offlineDb, 'deleteMutation');

    await syncManager.resolveConflict(mutationId, 'keep_server');

    expect(deleteSpy).toHaveBeenCalledWith(mutationId);
    expect(syncManager.getSyncStatus()).toBe('synced');
  });

  it('handles multi-entity offline recovery across daily, weekly, monthly, annual, mood, and habit', async () => {
    const entities: OfflineMutation[] = [
      {
        id: 'mut-daily-1',
        userId,
        entityType: 'daily',
        entityKey: '2026-10-15',
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        payload: { intention: 'Daily intention' },
        createdAt: Date.now() - 500,
        retryCount: 0,
        status: 'pending',
      },
      {
        id: 'mut-weekly-1',
        userId,
        entityType: 'weekly',
        entityKey: '2026-42',
        endpoint: '/api/v1/planner/weekly/2026/42',
        method: 'PUT',
        payload: { notes: 'Weekly note' },
        createdAt: Date.now() - 400,
        retryCount: 0,
        status: 'pending',
      },
      {
        id: 'mut-monthly-1',
        userId,
        entityType: 'monthly',
        entityKey: '2026-10',
        endpoint: '/api/v1/planner/monthly/2026/10',
        method: 'PUT',
        payload: { selfChangeReflection: 'Monthly reflection' },
        createdAt: Date.now() - 300,
        retryCount: 0,
        status: 'pending',
      },
      {
        id: 'mut-annual-1',
        userId,
        entityType: 'annual',
        entityKey: '2026',
        endpoint: '/api/v1/planner/year/2026',
        method: 'PUT',
        payload: { theme: 'Growth' },
        createdAt: Date.now() - 200,
        retryCount: 0,
        status: 'pending',
      },
      {
        id: 'mut-mood-1',
        userId,
        entityType: 'mood',
        entityKey: '2026-10-15',
        endpoint: '/api/v1/trackers/mood',
        method: 'POST',
        payload: { date: '2026-10-15', moodKey: 'great' },
        createdAt: Date.now() - 100,
        retryCount: 0,
        status: 'pending',
      },
      {
        id: 'mut-habit-1',
        userId,
        entityType: 'habit',
        entityKey: 'habit-xyz',
        endpoint: '/api/v1/trackers/habits/habit-xyz/toggle',
        method: 'POST',
        payload: { date: '2026-10-15', completed: true },
        createdAt: Date.now(),
        retryCount: 0,
        status: 'pending',
      },
    ];

    mockMutations.push(...entities);

    const calledEndpoints: string[] = [];
    const fetchSpy = vi.fn().mockImplementation(async (url: string) => {
      calledEndpoints.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      };
    });
    vi.stubGlobal('fetch', fetchSpy);

    await syncManager.syncPending();

    expect(calledEndpoints).toEqual([
      '/api/v1/planner/daily/2026-10-15',
      '/api/v1/planner/weekly/2026/42',
      '/api/v1/planner/monthly/2026/10',
      '/api/v1/planner/year/2026',
      '/api/v1/trackers/mood',
      '/api/v1/trackers/habits/habit-xyz/toggle',
    ]);
    expect(mockMutations).toHaveLength(0);
    expect(syncManager.getSyncStatus()).toBe('synced');
  });

  it('strictly isolates queues between User A and User B during account switches', async () => {
    const userA = 'user-alpha-111';
    const userB = 'user-bravo-222';

    // Queue mutation under User A
    syncManager.setActiveUser(userA);
    mockMutations.push({
      id: 'mut-alpha-private',
      userId: userA,
      entityType: 'daily',
      entityKey: '2026-10-15',
      endpoint: '/api/v1/planner/daily/2026-10-15',
      method: 'PUT',
      payload: { intention: 'User A private journal' },
      createdAt: Date.now(),
      retryCount: 0,
      status: 'pending',
    });

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    // Switch account to User B while offline
    vi.stubGlobal('navigator', { onLine: false });
    syncManager.setActiveUser(userB);

    // Reconnect while User B is active
    vi.stubGlobal('navigator', { onLine: true });
    await syncManager.syncPending();

    // Verify User B made ZERO requests: User A mutation was NOT dispatched under User B
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockMutations.filter((m) => m.userId === userA)).toHaveLength(1);

    // Switch back to User A
    syncManager.setActiveUser(userA);
    await new Promise((r) => setTimeout(r, 20));
    await syncManager.syncPending();

    // Now User A's mutation syncs successfully under User A
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/planner/daily/2026-10-15',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Mutation-Id': 'mut-alpha-private' }),
      })
    );
    expect(mockMutations.filter((m) => m.userId === userA)).toHaveLength(0);
  });

  it('retains pending mutations safely when sync is interrupted by network failure', async () => {
    mockMutations.push(
      {
        id: 'mut-first-success',
        userId,
        entityType: 'daily',
        entityKey: '2026-10-15',
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        payload: { intention: 'First edit' },
        createdAt: Date.now() - 100,
        retryCount: 0,
        status: 'pending',
      },
      {
        id: 'mut-second-interrupted',
        userId,
        entityType: 'daily',
        entityKey: '2026-10-15',
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        payload: { intention: 'Second edit' },
        createdAt: Date.now(),
        retryCount: 0,
        status: 'pending',
      }
    );

    let callCount = 0;
    const fetchSpy = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: true, status: 200, json: async () => ({ success: true }) };
      }
      // Network abruptly drops on second request
      throw new TypeError('Network request failed');
    });
    vi.stubGlobal('fetch', fetchSpy);

    await syncManager.syncPending();

    // First mutation succeeded and was removed
    expect(mockMutations.find((m) => m.id === 'mut-first-success')).toBeUndefined();
    // Second mutation was preserved in queue with retryCount incremented
    const interrupted = mockMutations.find((m) => m.id === 'mut-second-interrupted');
    expect(interrupted).toBeDefined();
    expect(interrupted?.retryCount).toBe(1);
    expect(['error', 'offline']).toContain(syncManager.getSyncStatus());
  });

  it('handles RECORD_DELETED_ON_SERVER conflict without losing local draft', async () => {
    mockMutations.push({
      id: 'mut-deleted-record',
      userId,
      entityType: 'daily',
      entityKey: '2026-10-15',
      endpoint: '/api/v1/planner/daily/2026-10-15',
      method: 'PUT',
      payload: { intention: 'Draft for deleted day' },
      createdAt: Date.now(),
      retryCount: 0,
      status: 'pending',
    });

    const conflictListener = vi.fn();
    syncManager.onConflict(conflictListener);

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: {
          code: 'RECORD_DELETED_ON_SERVER',
          message: 'This daily plan no longer exists on the server.',
          conflictReason: 'RECORD_DELETED_ON_SERVER',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    await syncManager.syncPending();

    expect(syncManager.getSyncStatus()).toBe('conflict');
    expect(conflictListener).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          code: 'RECORD_DELETED_ON_SERVER',
          conflictReason: 'RECORD_DELETED_ON_SERVER',
        }),
      })
    );
    // Local mutation is marked as conflict and NOT deleted from IndexedDB
    const conflictMutation = mockMutations.find((m) => m.id === 'mut-deleted-record');
    expect(conflictMutation?.status).toBe('conflict');
  });
});
