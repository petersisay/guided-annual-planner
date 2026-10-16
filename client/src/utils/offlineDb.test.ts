import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as offlineDb from './offlineDb';
import { OfflineMutation } from '@planner/shared';

describe('Offline Database (IndexedDB Service)', () => {
  let mockQueueStore: Map<string, OfflineMutation>;
  let mockCacheStore: Map<string, offlineDb.CachedRecord>;

  beforeEach(() => {
    mockQueueStore = new Map();
    mockCacheStore = new Map();

    // Mock IDBDatabase transaction & objectStore implementation
    const fakeDb = {
      transaction: (storeNames: string | string[], mode: string) => {
        const storeName = Array.isArray(storeNames) ? storeNames[0] : storeNames;

        if (storeName === 'mutationQueue') {
          return {
            objectStore: () => ({
              add: (item: OfflineMutation) => {
                mockQueueStore.set(item.id, item);
                const req: any = {};
                setTimeout(() => req.onsuccess && req.onsuccess({ target: { result: item.id } }), 0);
                return req;
              },
              put: (item: OfflineMutation) => {
                mockQueueStore.set(item.id, item);
                const req: any = {};
                setTimeout(() => req.onsuccess && req.onsuccess({ target: { result: item.id } }), 0);
                return req;
              },
              get: (id: string) => {
                const req: any = {};
                setTimeout(() => {
                  req.result = mockQueueStore.get(id);
                  req.onsuccess && req.onsuccess();
                }, 0);
                return req;
              },
              delete: (id: string) => {
                mockQueueStore.delete(id);
                const req: any = {};
                setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                return req;
              },
              getAll: () => {
                const req: any = {};
                setTimeout(() => {
                  req.result = Array.from(mockQueueStore.values());
                  req.onsuccess && req.onsuccess();
                }, 0);
                return req;
              },
              index: (indexName: string) => ({
                getAll: (range: any) => {
                  const req: any = {};
                  setTimeout(() => {
                    const userId = range?.lower || range;
                    const items = Array.from(mockQueueStore.values()).filter(
                      (m) => m.userId === userId
                    );
                    req.result = items;
                    req.onsuccess && req.onsuccess();
                  }, 0);
                  return req;
                },
                openCursor: (range: any) => {
                  const req: any = {};
                  setTimeout(() => {
                    const userId = range?.lower || range;
                    const userKeys = Array.from(mockQueueStore.entries())
                      .filter(([_, m]) => m.userId === userId)
                      .map(([k]) => k);
                    userKeys.forEach((k) => mockQueueStore.delete(k));
                    req.result = null; // finished cursor
                    req.onsuccess && req.onsuccess();
                  }, 0);
                  return req;
                },
              }),
            }),
          };
        }

        if (storeName === 'cachedRecords') {
          return {
            objectStore: () => ({
              put: (record: offlineDb.CachedRecord) => {
                mockCacheStore.set(record.id, record);
                const req: any = {};
                setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                return req;
              },
              get: (id: string) => {
                const req: any = {};
                setTimeout(() => {
                  req.result = mockCacheStore.get(id);
                  req.onsuccess && req.onsuccess();
                }, 0);
                return req;
              },
              index: () => ({
                openCursor: (range: any) => {
                  const req: any = {};
                  setTimeout(() => {
                    const userId = range?.lower || range;
                    const userKeys = Array.from(mockCacheStore.entries())
                      .filter(([_, r]) => r.userId === userId)
                      .map(([k]) => k);
                    userKeys.forEach((k) => mockCacheStore.delete(k));
                    req.result = null;
                    req.onsuccess && req.onsuccess();
                  }, 0);
                  return req;
                },
              }),
            }),
          };
        }

        throw new Error(`Unknown store name: ${storeName}`);
      },
    };

    offlineDb.setOfflineDbForTesting(fakeDb as any);
  });

  afterEach(() => {
    offlineDb.setOfflineDbForTesting(null);
  });

  describe('Mutation Queue & Strict User Segregation', () => {
    it('enqueues mutations with UUID, pending status, and timestamp', async () => {
      const mutation = await offlineDb.enqueueMutation({
        userId: 'user-123',
        entityType: 'daily',
        entityKey: '2026-10-15',
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        payload: { intention: 'Test offline intention' },
      });

      expect(mutation.id).toBeDefined();
      expect(mutation.userId).toBe('user-123');
      expect(mutation.status).toBe('pending');
      expect(mutation.retryCount).toBe(0);
      expect(mutation.createdAt).toBeGreaterThan(0);
    });

    it('retrieves pending mutations strictly for the active user, never leaking other users', async () => {
      // User A mutation
      await offlineDb.enqueueMutation({
        userId: 'user-A',
        entityType: 'daily',
        entityKey: '2026-10-15',
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        payload: { intention: 'User A private reflections' },
      });

      // User B mutation
      await offlineDb.enqueueMutation({
        userId: 'user-B',
        entityType: 'daily',
        entityKey: '2026-10-15',
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        payload: { intention: 'User B private thoughts' },
      });

      const userAPending = await offlineDb.getPendingMutations('user-A');
      const userBPending = await offlineDb.getPendingMutations('user-B');

      expect(userAPending).toHaveLength(1);
      expect(userAPending[0].payload.intention).toBe('User A private reflections');

      expect(userBPending).toHaveLength(1);
      expect(userBPending[0].payload.intention).toBe('User B private thoughts');

      // User C has no pending mutations
      const userCPending = await offlineDb.getPendingMutations('user-C');
      expect(userCPending).toHaveLength(0);
    });

    it('updates mutation status and deletes upon sync confirmation', async () => {
      const mutation = await offlineDb.enqueueMutation({
        userId: 'user-123',
        entityType: 'weekly',
        entityKey: '2026-42',
        endpoint: '/api/v1/planner/weekly/2026/42',
        method: 'PUT',
        payload: { notes: 'Weekly review' },
      });

      await offlineDb.updateMutation(mutation.id, {
        status: 'failed',
        retryCount: 1,
        lastError: 'Network timeout',
      });

      let pending = await offlineDb.getPendingMutations('user-123');
      expect(pending[0].status).toBe('failed');
      expect(pending[0].retryCount).toBe(1);

      // Confirm deletion upon sync
      await offlineDb.deleteMutation(mutation.id);
      pending = await offlineDb.getPendingMutations('user-123');
      expect(pending).toHaveLength(0);
    });

    it('clears mutations only for the specified user', async () => {
      await offlineDb.enqueueMutation({
        userId: 'user-A',
        entityType: 'daily',
        entityKey: '2026-10-15',
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        payload: { intention: 'User A' },
      });
      await offlineDb.enqueueMutation({
        userId: 'user-B',
        entityType: 'daily',
        entityKey: '2026-10-15',
        endpoint: '/api/v1/planner/daily/2026-10-15',
        method: 'PUT',
        payload: { intention: 'User B' },
      });

      await offlineDb.clearUserMutations('user-A');

      const userAPending = await offlineDb.getPendingMutations('user-A');
      const userBPending = await offlineDb.getPendingMutations('user-B');

      expect(userAPending).toHaveLength(0);
      expect(userBPending).toHaveLength(1);
    });

    it('coalesces multiple offline PUT updates to the same entity into a single merged mutation', async () => {
      const mut1 = await offlineDb.enqueueMutation({
        userId: 'user-123',
        entityType: 'monthly',
        entityKey: '2026-10',
        endpoint: '/api/v1/planner/monthly/2026/10',
        method: 'PUT',
        payload: { mustDos: [{ text: 'Task 1', checked: false }] },
        expectedUpdatedAt: '2026-10-15T12:00:00.000Z',
      });

      const mut2 = await offlineDb.enqueueMutation({
        userId: 'user-123',
        entityType: 'monthly',
        entityKey: '2026-10',
        endpoint: '/api/v1/planner/monthly/2026/10',
        method: 'PUT',
        payload: { newHabits: ['Read 10 mins'] },
        expectedUpdatedAt: '2026-10-15T12:00:00.000Z',
      });

      const pending = await offlineDb.getPendingMutations('user-123');
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(mut1.id);
      expect(pending[0].payload.mustDos).toBeDefined();
      expect(pending[0].payload.newHabits).toBeDefined();
      expect(pending[0].expectedUpdatedAt).toBe('2026-10-15T12:00:00.000Z');
    });

    it('retrieves conflicted mutations for a user correctly', async () => {
      const mut = await offlineDb.enqueueMutation({
        userId: 'user-123',
        entityType: 'monthly',
        entityKey: '2026-11',
        endpoint: '/api/v1/planner/monthly/2026/11',
        method: 'PUT',
        payload: { mustDos: [] },
      });

      await offlineDb.updateMutation(mut.id, {
        status: 'conflict',
        serverConflict: {
          code: 'CONCURRENT_MODIFICATION_CONFLICT',
          message: 'Conflict',
          conflictReason: 'MODIFIED_ON_SERVER',
        },
      });

      const conflicted = await offlineDb.getConflictedMutations('user-123');
      expect(conflicted).toHaveLength(1);
      expect(conflicted[0].id).toBe(mut.id);
    });
  });

  describe('Cached Records Store & Offline Fallback', () => {
    it('persists and retrieves cached plan records with updatedAt timestamp', async () => {
      const mockDailyPlan = {
        id: 'plan-daily-1',
        date: '2026-10-15',
        intention: 'Deep calm focus',
        reflection: 'Evening peace',
      };
      const updatedAt = '2026-10-15T10:00:00.000Z';

      await offlineDb.saveCachedRecord(
        'user-123',
        'daily',
        '2026-10-15',
        mockDailyPlan,
        updatedAt
      );

      const cached = await offlineDb.getCachedRecord(
        'user-123',
        'daily',
        '2026-10-15'
      );

      expect(cached).not.toBeNull();
      expect(cached?.data).toEqual(mockDailyPlan);
      expect(cached?.updatedAt).toBe(updatedAt);
      expect(cached?.userId).toBe('user-123');
    });

    it('isolates cached records by user ID', async () => {
      await offlineDb.saveCachedRecord(
        'user-A',
        'daily',
        '2026-10-15',
        { intention: 'User A secret' },
        '2026-10-15T10:00:00.000Z'
      );

      const cachedB = await offlineDb.getCachedRecord(
        'user-B',
        'daily',
        '2026-10-15'
      );

      expect(cachedB).toBeNull();
    });
  });
});
