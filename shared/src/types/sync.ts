export type SyncStatus =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'synced'
  | 'offline_saved'
  | 'offline'
  | 'online'
  | 'syncing'
  | 'conflict'
  | 'error';

export type MutationStatus =
  | 'pending'
  | 'syncing'
  | 'processing'
  | 'synchronized'
  | 'conflict'
  | 'failed'
  | 'failed_permanent'
  | 'failed_transient';

export type EntityType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'annual'
  | 'mood'
  | 'habit';

export interface OfflineMutation<T = any> {
  id: string; // Stable UUID mutation identifier
  userId: string; // Strictly scoped to authenticated user
  entityType: EntityType;
  entityKey: string; // e.g. "2026-10-15", "2026-42", "2026-10", "2026"
  endpoint: string;
  method: 'PUT' | 'POST' | 'DELETE';
  payload: T;
  expectedUpdatedAt?: string; // ISO 8601 timestamp for optimistic concurrency
  status: MutationStatus;
  retryCount: number;
  nextRetryAt?: number; // Epoch timestamp ms
  lastError?: string;
  createdAt: number; // Epoch ms timestamp
  updatedAt?: string; // ISO 8601
  clientVersion?: unknown;
  serverVersion?: unknown;
  serverConflict?: ConflictPayload<any>;
}

export interface ConflictPayload<T = any> {
  code?: string;
  message?: string;
  mutationId?: string;
  entityType?: EntityType;
  entityKey?: string;
  clientVersion?: T;
  serverVersion?: T;
  conflictFields?: string[];
  conflictReason?: 'MODIFIED_ON_SERVER' | 'RECORD_DELETED_ON_SERVER';
}

export type ConflictResolutionStrategy =
  | 'keep_local'
  | 'keep_server'
  | 'combine';
