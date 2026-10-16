import {
  SyncStatus,
  EntityType,
  OfflineMutation,
  ConflictPayload,
  ConflictResolutionStrategy,
} from '@planner/shared';
import {
  enqueueMutation,
  getPendingMutations,
  getPendingMutationsCount,
  getConflictedMutations,
  updateMutation,
  deleteMutation,
  saveCachedRecord,
} from '../utils/offlineDb';

type SyncStatusListener = (status: SyncStatus) => void;
type ConflictListener = (conflict: { mutation: OfflineMutation; payload: ConflictPayload }) => void;
type QueueChangeListener = (pendingCount: number) => void;
type MutationSuccessListener = (mutation: OfflineMutation, data: any) => void;

class SyncManager {
  private activeUserId: string | null = null;
  private syncStatus: SyncStatus = 'synced';
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private isSyncing = false;
  private initialized = false;

  private statusListeners: Set<SyncStatusListener> = new Set();
  private conflictListeners: Set<ConflictListener> = new Set();
  private queueListeners: Set<QueueChangeListener> = new Set();
  private successListeners: Set<MutationSuccessListener> = new Set();

  public initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    window.addEventListener('online', () => {
      this.setSyncStatus('online');
      this.syncPending();
    });

    window.addEventListener('offline', () => {
      this.setSyncStatus('offline');
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.syncPending();
      }
    });

    // Check initial online status
    if (!navigator.onLine) {
      this.setSyncStatus('offline');
    }
  }

  public setActiveUser(userId: string | null): void {
    if (this.activeUserId === userId) return;

    this.activeUserId = userId;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.isSyncing = false;

    if (userId) {
      this.updateQueueCount();
      if (navigator.onLine) {
        this.syncPending();
      } else {
        this.setSyncStatus('offline');
      }
    } else {
      this.setSyncStatus('synced');
      this.notifyQueueListeners(0);
    }
  }

  public getActiveUserId(): string | null {
    return this.activeUserId;
  }

  public getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  private setSyncStatus(status: SyncStatus): void {
    this.syncStatus = status;
    this.statusListeners.forEach((l) => l(status));
  }

  public onStatusChange(listener: SyncStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.syncStatus);
    return () => this.statusListeners.delete(listener);
  }

  public onConflict(listener: ConflictListener): () => void {
    this.conflictListeners.add(listener);
    return () => this.conflictListeners.delete(listener);
  }

  public onQueueChange(listener: QueueChangeListener): () => void {
    this.queueListeners.add(listener);
    if (this.activeUserId) {
      getPendingMutationsCount(this.activeUserId).then((c) => listener(c)).catch(() => {});
    } else {
      listener(0);
    }
    return () => this.queueListeners.delete(listener);
  }

  public onMutationSuccess(listener: MutationSuccessListener): () => void {
    this.successListeners.add(listener);
    return () => this.successListeners.delete(listener);
  }

  private notifyQueueListeners(count: number): void {
    this.queueListeners.forEach((l) => l(count));
  }

  private async updateQueueCount(): Promise<number> {
    if (!this.activeUserId) return 0;
    try {
      const count = await getPendingMutationsCount(this.activeUserId);
      this.notifyQueueListeners(count);
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Enqueue a mutation for the current user and immediately attempt sync if online.
   */
  public async queueMutation(params: {
    userId: string;
    entityType: EntityType;
    entityKey: string;
    endpoint: string;
    method: 'PUT' | 'POST' | 'DELETE';
    payload: any;
    expectedUpdatedAt?: string;
  }): Promise<OfflineMutation> {
    const mutation = await enqueueMutation({
      userId: params.userId,
      entityType: params.entityType,
      entityKey: params.entityKey,
      endpoint: params.endpoint,
      method: params.method,
      payload: params.payload,
      expectedUpdatedAt: params.expectedUpdatedAt,
    });

    await this.updateQueueCount();

    if (navigator.onLine && this.activeUserId === params.userId) {
      this.syncPending();
    } else {
      this.setSyncStatus('offline');
    }

    return mutation;
  }

  /**
   * Process pending mutations sequentially for the active user.
   */
  public async syncPending(): Promise<void> {
    if (this.isSyncing || !this.activeUserId || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    this.setSyncStatus('syncing');

    try {
      const pending = await getPendingMutations(this.activeUserId);

      if (pending.length === 0) {
        this.setSyncStatus('synced');
        this.isSyncing = false;
        await this.updateQueueCount();
        return;
      }

      for (const mutation of pending) {
        // Stop if user changed or went offline in the meantime
        if (!navigator.onLine || this.activeUserId !== mutation.userId) {
          break;
        }

        // If mutation is in conflict state, wait for user resolution
        if (mutation.status === 'conflict') {
          continue;
        }

        await updateMutation(mutation.id, { status: 'processing' });

        try {
          const bodyPayload = {
            ...(mutation.payload || {}),
            ...(mutation.expectedUpdatedAt ? { expectedUpdatedAt: mutation.expectedUpdatedAt } : {}),
          };

          const res = await fetch(mutation.endpoint, {
            method: mutation.method,
            headers: {
              'Content-Type': 'application/json',
              'X-Planner-Client': 'WebApp',
              'X-Mutation-Id': mutation.id,
            },
            credentials: 'include',
            body: mutation.method !== 'DELETE' ? JSON.stringify(bodyPayload) : undefined,
          });

          if (res.status === 409) {
            // Optimistic concurrency conflict detected
            const errorJson = await res.json().catch(() => ({}));
            const conflictPayload: ConflictPayload = {
              code: errorJson?.error?.code || 'CONCURRENT_MODIFICATION_CONFLICT',
              message: errorJson?.error?.message || 'Conflict detected',
              conflictReason: errorJson?.error?.conflictReason || 'MODIFIED_ON_SERVER',
              serverVersion: errorJson?.error?.serverVersion,
            };

            await updateMutation(mutation.id, {
              status: 'conflict',
              serverConflict: conflictPayload,
            });

            this.setSyncStatus('conflict');
            this.conflictListeners.forEach((l) =>
              l({ mutation, payload: conflictPayload })
            );
            // Halt queue sync for this entity to prevent cascaded divergence
            break;
          }

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Server returned HTTP ${res.status}`);
          }

          const responseData = await res.json();

          // Sync succeeded: update local cache with verified server record
          const savedData = responseData.plan || responseData.data || responseData;
          const serverUpdatedAt = savedData?.updatedAt || new Date().toISOString();

          await saveCachedRecord(
            mutation.userId,
            mutation.entityType,
            mutation.entityKey,
            savedData,
            serverUpdatedAt
          );

          // Safely remove mutation from queue
          await deleteMutation(mutation.id);

          this.successListeners.forEach((l) => l(mutation, savedData));
        } catch (netErr: any) {
          // Network interruption or transient error
          const retryCount = mutation.retryCount + 1;
          const delay = Math.min(30000, 1000 * Math.pow(2, retryCount)) + Math.random() * 1000;

          await updateMutation(mutation.id, {
            status: 'failed',
            retryCount,
            lastError: netErr?.message || 'Network error',
          });

          this.setSyncStatus(navigator.onLine ? 'error' : 'offline');

          // Schedule backoff retry if still online
          if (navigator.onLine && !this.retryTimer) {
            this.retryTimer = setTimeout(() => {
              this.retryTimer = null;
              this.syncPending();
            }, delay);
          }
          break;
        }
      }

      const remaining = await this.updateQueueCount();
      if (remaining === 0) {
        this.setSyncStatus('synced');
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Resolve an active conflict based on user's choice.
   */
  public async resolveConflict(
    mutationId: string,
    strategy: ConflictResolutionStrategy,
    mergedPayload?: any
  ): Promise<void> {
    if (!this.activeUserId) return;

    if (strategy === 'keep_server') {
      // Discard local mutation
      await deleteMutation(mutationId);
      await this.updateQueueCount();
      this.setSyncStatus('synced');
      return;
    }

    if (strategy === 'keep_local') {
      // Overwrite server by removing expectedUpdatedAt constraint or updating to latest server updatedAt
      await updateMutation(mutationId, {
        status: 'pending',
        expectedUpdatedAt: undefined, // unconditional overwrite
        serverConflict: undefined,
      });
      await this.syncPending();
      return;
    }

    if (strategy === 'combine' && mergedPayload) {
      // Apply merged payload
      await updateMutation(mutationId, {
        status: 'pending',
        payload: mergedPayload,
        expectedUpdatedAt: undefined,
        serverConflict: undefined,
      });
      await this.syncPending();
      return;
    }
  }

  /**
   * Get all active conflicted mutations for the current user.
   */
  public async getConflictedMutations(): Promise<OfflineMutation[]> {
    if (!this.activeUserId) return [];
    return await getConflictedMutations(this.activeUserId);
  }

  /**
   * Resolve all active conflicts in batch (e.g. keep all offline changes or drop all offline changes).
   */
  public async resolveAllConflicts(strategy: ConflictResolutionStrategy): Promise<void> {
    if (!this.activeUserId) return;
    const conflicted = await getConflictedMutations(this.activeUserId);
    for (const m of conflicted) {
      if (strategy === 'keep_server') {
        await deleteMutation(m.id);
      } else if (strategy === 'keep_local') {
        await updateMutation(m.id, {
          status: 'pending',
          expectedUpdatedAt: undefined, // unconditional overwrite
          serverConflict: undefined,
        });
      }
    }
    const remaining = await this.updateQueueCount();
    if (strategy === 'keep_local' && navigator.onLine) {
      await this.syncPending();
    } else if (strategy === 'keep_server') {
      if (remaining === 0) {
        this.setSyncStatus('synced');
      }
    }
  }

  /**
   * Export unsynced mutations to a downloadable JSON file so no edits are ever lost.
   */
  public async exportUnsyncedData(userId: string): Promise<void> {
    const pending = await getPendingMutations(userId);
    const exportData = {
      exportType: 'GuidedAnnualPlanner_UnsyncedEdits_Rescue',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userId,
      pendingCount: pending.length,
      mutations: pending,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `guided-planner-unsynced-edits-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}

export const syncManager = new SyncManager();
