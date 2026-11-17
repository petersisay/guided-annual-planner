import { useState, useRef, useCallback, useEffect } from 'react';
import { syncManager } from '../services/syncManager.js';
import { saveCachedRecord } from '../utils/offlineDb.js';
import { editorDirtyTracker } from '../services/editorDirtyTracker.js';

export function usePlanAutosave(initialPlan, options) {
  const [plan, setPlan] = useState(initialPlan);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState(null);
  const [activeConflict, setActiveConflict] = useState(null);

  const saveSeqRef = useRef(0);
  const lastConfirmedPlanRef = useRef(initialPlan);
  const pendingUpdatesRef = useRef(null);
  const debouncedUpdatesRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const activeSavePromiseRef = useRef(null);
  const isDirtyRef = useRef(false);

  // Sync internal ref when initialPlan is loaded or reloaded
  const setConfirmedPlan = useCallback((newPlan) => {
    lastConfirmedPlanRef.current = newPlan;
    isDirtyRef.current = false;
    setPlan(newPlan);
  }, []);

  // Listen for background sync success or conflicts related to this entity
  useEffect(() => {
    if (!options.entityType || !options.entityKey) return;

    const unsubSuccess = syncManager.onMutationSuccess((mutation, data) => {
      if (
        mutation.entityType === options.entityType &&
        mutation.entityKey === options.entityKey
      ) {
        lastConfirmedPlanRef.current = data;
        setPlan(data);
        setSaveStatus('saved');
        setSaveError(null);
        setActiveConflict(null);
        isDirtyRef.current = false;
        options.onSuccess?.(data);
      }
    });

    const unsubConflict = syncManager.onConflict(({ mutation, payload }) => {
      if (
        mutation.entityType === options.entityType &&
        mutation.entityKey === options.entityKey
      ) {
        setSaveStatus('conflict');
        setActiveConflict(payload);
        isDirtyRef.current = true;
      }
    });

    return () => {
      unsubSuccess();
      unsubConflict();
    };
  }, [options.entityType, options.entityKey, options.onSuccess]);

  const triggerSaveInternal = useCallback(
    async (updates) => {
      if (!plan) return false;

      // Apply optimistic update immediately to local state
      const optimistic = { ...plan, ...updates };
      setPlan(optimistic);
      setSaveError(null);
      pendingUpdatesRef.current = updates;
      isDirtyRef.current = true;

      const currentSeq = ++saveSeqRef.current;
      const expectedUpdatedAt = plan?.updatedAt;

      // 1. If currently offline, queue mutation directly to IndexedDB
      if (
        typeof navigator !== 'undefined' &&
        !navigator.onLine &&
        options.entityType &&
        options.entityKey &&
        options.userId &&
        options.endpoint
      ) {
        try {
          await saveCachedRecord(
            options.userId,
            options.entityType,
            options.entityKey,
            optimistic,
            expectedUpdatedAt || new Date().toISOString()
          );

          await syncManager.queueMutation({
            userId: options.userId,
            entityType: options.entityType,
            entityKey: options.entityKey,
            endpoint: options.endpoint,
            method: options.method || 'PUT',
            payload: updates,
            expectedUpdatedAt,
          });

          setSaveStatus('offline_saved');
          isDirtyRef.current = false;
          return true;
        } catch (queueErr) {
          console.warn('Failed to queue offline mutation:', queueErr);
          setSaveStatus('error');
          return false;
        }
      }

      setSaveStatus('saving');

      // 2. Attempt online network save
      try {
        const saved = await options.saveFn(updates);

        if (currentSeq !== saveSeqRef.current) {
          return true;
        }

        lastConfirmedPlanRef.current = saved;
        pendingUpdatesRef.current = null;
        debouncedUpdatesRef.current = null;
        isDirtyRef.current = false;
        setPlan(saved);
        setSaveStatus('saved');
        setSaveError(null);
        setActiveConflict(null);
        options.onSuccess?.(saved);

        // Also update local cache for offline reliability
        if (options.entityType && options.entityKey && options.userId) {
          saveCachedRecord(
            options.userId,
            options.entityType,
            options.entityKey,
            saved,
            saved?.updatedAt || new Date().toISOString()
          ).catch(() => {});
        }
        return true;
      } catch (err) {
        if (currentSeq !== saveSeqRef.current) {
          return false;
        }

        const msg = err instanceof Error ? err.message : 'Save failed';
        const isNetworkErr =
          !navigator.onLine ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg.includes('network');

        // If network failed, fall back to offline queue
        if (
          isNetworkErr &&
          options.entityType &&
          options.entityKey &&
          options.userId &&
          options.endpoint
        ) {
          try {
            await saveCachedRecord(
              options.userId,
              options.entityType,
              options.entityKey,
              optimistic,
              expectedUpdatedAt || new Date().toISOString()
            );

            await syncManager.queueMutation({
              userId: options.userId,
              entityType: options.entityType,
              entityKey: options.entityKey,
              endpoint: options.endpoint,
              method: options.method || 'PUT',
              payload: updates,
              expectedUpdatedAt,
            });

            setSaveStatus('offline_saved');
            isDirtyRef.current = false;
            return true;
          } catch (offlineErr) {
            console.error('Failed to queue offline fallback:', offlineErr);
          }
        }

        if (msg.includes('CONCURRENT_MODIFICATION_CONFLICT') || msg.includes('Conflict')) {
          setSaveStatus('conflict');
        } else {
          setSaveStatus('error');
        }
        setSaveError(msg);
        isDirtyRef.current = true;
        options.onError?.(err, updates);
        return false;
      }
    },
    [plan, options]
  );

  const triggerSave = useCallback(
    (updates) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      debouncedUpdatesRef.current = null;

      const p = triggerSaveInternal(updates).finally(() => {
        if (activeSavePromiseRef.current === p) {
          activeSavePromiseRef.current = null;
        }
      });
      activeSavePromiseRef.current = p;
      return p;
    },
    [triggerSaveInternal]
  );

  const debouncedSave = useCallback(
    (updates, delayMs = 400) => {
      if (!plan) return;

      // Optimistically update view immediately
      const optimistic = { ...plan, ...updates };
      setPlan(optimistic);
      isDirtyRef.current = true;

      // Merge pending updates
      debouncedUpdatesRef.current = {
        ...(debouncedUpdatesRef.current || {}),
        ...updates,
      };

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        if (debouncedUpdatesRef.current) {
          const toSave = debouncedUpdatesRef.current;
          debouncedUpdatesRef.current = null;
          triggerSave(toSave);
        }
      }, delayMs);
    },
    [plan, triggerSave]
  );

  const flushSave = useCallback(async () => {
    // 1. If debounced updates are waiting in memory, trigger immediate save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (debouncedUpdatesRef.current) {
      const toSave = debouncedUpdatesRef.current;
      debouncedUpdatesRef.current = null;
      return await triggerSave(toSave);
    }

    // 2. If a save is actively in flight, await it
    if (activeSavePromiseRef.current) {
      return await activeSavePromiseRef.current;
    }

    // 3. Return true if no pending dirty changes and no active conflict
    return !isDirtyRef.current && !activeConflict && saveStatus !== 'error' && saveStatus !== 'conflict';
  }, [triggerSave, activeConflict, saveStatus]);

  // Register with global EditorDirtyTracker
  useEffect(() => {
    const editorId = `${options.entityType || 'editor'}:${options.entityKey || 'default'}`;
    const unregister = editorDirtyTracker.register({
      id: editorId,
      isDirty: () =>
        isDirtyRef.current ||
        Boolean(debounceTimerRef.current) ||
        Boolean(debouncedUpdatesRef.current) ||
        saveStatus === 'saving' ||
        saveStatus === 'conflict' ||
        saveStatus === 'error',
      hasConflict: () => Boolean(activeConflict) || saveStatus === 'conflict',
      flush: flushSave,
    });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      unregister();
    };
  }, [options.entityType, options.entityKey, activeConflict, saveStatus, flushSave]);

  const retryLastSave = useCallback(() => {
    if (pendingUpdatesRef.current) {
      triggerSave(pendingUpdatesRef.current);
    }
  }, [triggerSave]);

  const rollbackToLastConfirmed = useCallback(() => {
    if (lastConfirmedPlanRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      debouncedUpdatesRef.current = null;
      isDirtyRef.current = false;
      setPlan(lastConfirmedPlanRef.current);
      setSaveStatus('idle');
      setSaveError(null);
      setActiveConflict(null);
      pendingUpdatesRef.current = null;
    }
  }, []);

  return {
    plan,
    setPlan,
    setConfirmedPlan,
    saveStatus,
    saveError,
    activeConflict,
    triggerSave,
    debouncedSave,
    flushSave,
    retryLastSave,
    rollbackToLastConfirmed,
    pendingUpdates: pendingUpdatesRef.current,
    isDirty: isDirtyRef.current || Boolean(debounceTimerRef.current),
  };
}
