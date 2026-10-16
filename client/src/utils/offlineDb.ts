import {
  OfflineMutation,
  EntityType,
} from '@planner/shared';

const DB_NAME = 'guided_planner_offline_db';
const DB_VERSION = 1;

export interface CachedRecord<T = unknown> {
  id: string; // ${userId}:${entityType}:${entityKey}
  userId: string;
  entityType: EntityType;
  entityKey: string;
  data: T;
  updatedAt: string;
  cachedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function setOfflineDbForTesting(db: IDBDatabase | null): void {
  dbPromise = db ? Promise.resolve(db) : null;
}

export function isIndexedDbSupported(): boolean {
  return (typeof window !== 'undefined' && !!window.indexedDB) || dbPromise !== null;
}

export function getOfflineDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    // Graceful fallback for non-browser or disabled environments
    if (!isIndexedDbSupported()) {
      reject(new Error('IndexedDB is not supported or available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Mutation Queue Store
      if (!db.objectStoreNames.contains('mutationQueue')) {
        const queueStore = db.createObjectStore('mutationQueue', { keyPath: 'id' });
        queueStore.createIndex('userId', 'userId', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('timestamp', 'createdAt', { unique: false });
        queueStore.createIndex('user_status', ['userId', 'status'], { unique: false });
      }

      // 2. Cached Records Store
      if (!db.objectStoreNames.contains('cachedRecords')) {
        const cacheStore = db.createObjectStore('cachedRecords', { keyPath: 'id' });
        cacheStore.createIndex('userId', 'userId', { unique: false });
        cacheStore.createIndex('entityType', 'entityType', { unique: false });
        cacheStore.createIndex('user_entity', ['userId', 'entityType'], { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open offline IndexedDB'));
    };
  });

  return dbPromise;
}

/**
 * Enqueue a new mutation to be synced when online, or coalesce into an existing pending mutation.
 */
export async function enqueueMutation(
  mutationData: Omit<OfflineMutation, 'id' | 'createdAt' | 'retryCount' | 'status'>
): Promise<OfflineMutation> {
  const id = crypto.randomUUID();
  const mutation: OfflineMutation = {
    ...mutationData,
    id,
    createdAt: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  if (!isIndexedDbSupported()) {
    return mutation;
  }

  const db = await getOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('mutationQueue', 'readwrite');
    const store = tx.objectStore('mutationQueue');
    const index = store.index('userId');
    const keyRange = typeof IDBKeyRange !== 'undefined' ? IDBKeyRange.only(mutationData.userId) : (mutationData.userId as any);
    const getReq = index.getAll(keyRange);

    getReq.onsuccess = () => {
      const allUserMutations: OfflineMutation[] = getReq.result || [];
      const existing = allUserMutations.find(
        (m) =>
          m.entityType === mutationData.entityType &&
          m.entityKey === mutationData.entityKey &&
          (m.status === 'pending' || m.status === 'failed' || m.status === 'conflict')
      );

      if (existing && mutationData.method === 'PUT') {
        const mergedPayload = {
          ...(existing.payload || {}),
          ...(mutationData.payload || {}),
        };
        const updated: OfflineMutation = {
          ...existing,
          payload: mergedPayload,
          // Retain earliest expectedUpdatedAt to avoid artificial self-conflicts
          expectedUpdatedAt: existing.expectedUpdatedAt || mutationData.expectedUpdatedAt,
          status: 'pending',
          serverConflict: undefined,
          lastError: undefined,
        };

        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      } else {
        const req = store.add(mutation);
        req.onsuccess = () => resolve(mutation);
        req.onerror = () => reject(req.error);
      }
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Retrieve pending/failed mutations strictly scoped to the specified user.
 */
export async function getPendingMutations(userId: string): Promise<OfflineMutation[]> {
  if (!isIndexedDbSupported()) return [];
  const db = await getOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('mutationQueue', 'readonly');
    const store = tx.objectStore('mutationQueue');
    const index = store.index('userId');
    const keyRange = typeof IDBKeyRange !== 'undefined' ? IDBKeyRange.only(userId) : (userId as any);
    const req = index.getAll(keyRange);

    req.onsuccess = () => {
      const allUserMutations: OfflineMutation[] = req.result || [];
      const pending = allUserMutations
        .filter((m) => m.status === 'pending' || m.status === 'failed' || m.status === 'processing')
        .sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
      resolve(pending);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve mutations in conflict state strictly scoped to the specified user.
 */
export async function getConflictedMutations(userId: string): Promise<OfflineMutation[]> {
  if (!isIndexedDbSupported()) return [];
  const db = await getOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('mutationQueue', 'readonly');
    const store = tx.objectStore('mutationQueue');
    const index = store.index('userId');
    const keyRange = typeof IDBKeyRange !== 'undefined' ? IDBKeyRange.only(userId) : (userId as any);
    const req = index.getAll(keyRange);

    req.onsuccess = () => {
      const allUserMutations: OfflineMutation[] = req.result || [];
      const conflicted = allUserMutations
        .filter((m) => m.status === 'conflict')
        .sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
      resolve(conflicted);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Count pending mutations strictly scoped to the user (including conflicted).
 */
export async function getPendingMutationsCount(userId: string): Promise<number> {
  if (!isIndexedDbSupported()) return 0;
  const db = await getOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('mutationQueue', 'readonly');
    const store = tx.objectStore('mutationQueue');
    const index = store.index('userId');
    const keyRange = typeof IDBKeyRange !== 'undefined' ? IDBKeyRange.only(userId) : (userId as any);
    const req = index.getAll(keyRange);

    req.onsuccess = () => {
      const allUserMutations: OfflineMutation[] = req.result || [];
      const pending = allUserMutations.filter(
        (m) => m.status === 'pending' || m.status === 'failed' || m.status === 'processing' || m.status === 'conflict'
      );
      resolve(pending.length);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve ALL pending mutations across all accounts (used for global warnings before clearing).
 */
export async function getAllPendingMutations(): Promise<OfflineMutation[]> {
  if (!isIndexedDbSupported()) return [];
  const db = await getOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('mutationQueue', 'readonly');
    const store = tx.objectStore('mutationQueue');
    const req = store.getAll();

    req.onsuccess = () => {
      const all: OfflineMutation[] = req.result || [];
      resolve(all.filter((m) => m.status === 'pending' || m.status === 'failed' || m.status === 'processing'));
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Update the status, error, or retry count of a queued mutation.
 */
export async function updateMutation(
  id: string,
  updates: Partial<OfflineMutation>
): Promise<void> {
  if (!isIndexedDbSupported()) return;
  const db = await getOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('mutationQueue', 'readwrite');
    const store = tx.objectStore('mutationQueue');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing = getReq.result as OfflineMutation | undefined;
      if (!existing) {
        resolve();
        return;
      }

      const updated: OfflineMutation = {
        ...existing,
        ...updates,
      };

      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Delete a mutation once confirmed synced or discarded by user.
 */
export async function deleteMutation(id: string): Promise<void> {
  if (!isIndexedDbSupported()) return;
  const db = await getOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('mutationQueue', 'readwrite');
    const store = tx.objectStore('mutationQueue');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all mutations for a specific user (e.g. account purge or test reset).
 */
export async function clearUserMutations(userId: string): Promise<void> {
  if (!isIndexedDbSupported()) return;
  const db = await getOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('mutationQueue', 'readwrite');
    const store = tx.objectStore('mutationQueue');
    const index = store.index('userId');
    const keyRange = typeof IDBKeyRange !== 'undefined' ? IDBKeyRange.only(userId) : (userId as any);
    const req = index.openCursor(keyRange);

    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save or update a locally cached record with its known server updatedAt timestamp.
 */
export async function saveCachedRecord<T = unknown>(
  userId: string,
  entityType: EntityType,
  entityKey: string,
  data: T,
  updatedAt: string
): Promise<void> {
  if (!isIndexedDbSupported()) return;
  const db = await getOfflineDb();
  const id = `${userId}:${entityType}:${entityKey}`;

  const record: CachedRecord<T> = {
    id,
    userId,
    entityType,
    entityKey,
    data,
    updatedAt,
    cachedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedRecords', 'readwrite');
    const store = tx.objectStore('cachedRecords');
    const req = store.put(record);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve a cached record for offline fallback viewing.
 */
export async function getCachedRecord<T = unknown>(
  userId: string,
  entityType: EntityType,
  entityKey: string
): Promise<CachedRecord<T> | null> {
  if (!isIndexedDbSupported()) return null;
  const db = await getOfflineDb();
  const id = `${userId}:${entityType}:${entityKey}`;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedRecords', 'readonly');
    const store = tx.objectStore('cachedRecords');
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear cached records for a user.
 */
export async function clearUserCache(userId: string): Promise<void> {
  if (!isIndexedDbSupported()) return;
  const db = await getOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedRecords', 'readwrite');
    const store = tx.objectStore('cachedRecords');
    const index = store.index('userId');
    const keyRange = typeof IDBKeyRange !== 'undefined' ? IDBKeyRange.only(userId) : (userId as any);
    const req = index.openCursor(keyRange);

    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}
