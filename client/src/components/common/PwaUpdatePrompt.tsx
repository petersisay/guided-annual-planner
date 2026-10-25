import React, { useState, useEffect } from 'react';
import { RefreshCw, X, AlertCircle } from 'lucide-react';
import { applyUpdate } from '../../serviceWorkerRegistration';
import { syncManager } from '../../services/syncManager';
import { getPendingMutationsCount } from '../../utils/offlineDb';
import { editorDirtyTracker } from '../../services/editorDirtyTracker';

interface PwaUpdatePromptProps {
  registration: ServiceWorkerRegistration | null;
  onDismiss?: () => void;
}

export const PwaUpdatePrompt: React.FC<PwaUpdatePromptProps> = ({
  registration,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!registration) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const activeUserId = syncManager.getActiveUserId();
    if (activeUserId) {
      getPendingMutationsCount(activeUserId)
        .then((count) => setPendingCount(count))
        .catch(() => setPendingCount(0));
    }
  }, [registration]);

  if (!isVisible || !registration) {
    return null;
  }

  const handleUpdate = async () => {
    setIsUpdating(true);
    setErrorMessage(null);

    // 1. Block update if an unresolved conflict exists in any active editor
    if (editorDirtyTracker.hasUnresolvedConflicts()) {
      setIsUpdating(false);
      setErrorMessage('Cannot update: Please resolve version conflicts first.');
      return;
    }

    // 2. Explicitly flush all uncommitted keystrokes & debounced saves
    const flushResult = await editorDirtyTracker.flushAll();
    if (!flushResult.success) {
      setIsUpdating(false);
      if (flushResult.reason === 'conflict') {
        setErrorMessage('Cannot update: A concurrency conflict was detected.');
      } else {
        setErrorMessage('Cannot update: Unsaved edits could not be safely persisted.');
      }
      return;
    }

    // 3. If user is online and has pending offline queue items, flush them
    const activeUserId = syncManager.getActiveUserId();
    if (activeUserId && pendingCount > 0 && navigator.onLine) {
      try {
        await syncManager.syncPending();
      } catch (err) {
        console.warn('[PwaUpdatePrompt] Pre-update sync flush error:', err);
      }
    }

    // 4. Final safety check: ensure no editor is currently dirty
    if (editorDirtyTracker.isAnyDirty() || editorDirtyTracker.hasUnresolvedConflicts()) {
      setIsUpdating(false);
      setErrorMessage('New unsaved changes detected. Please save before updating.');
      return;
    }

    // 5. Apply the service worker update smoothly
    applyUpdate(registration);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div
      role="region"
      aria-label="Application update available"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full p-4 bg-paper-alt border border-border-strong rounded-xl shadow-paper-lg transition-all duration-300 motion-reduce:transition-none"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-sage-surface border border-sage/30 flex items-center justify-center shrink-0 text-sage mt-0.5">
          <RefreshCw className="w-4 h-4" />
        </div>

        <div className="flex-1">
          <h4 className="font-serif text-sm font-medium text-ink">
            Planner Update Available
          </h4>
          <p className="font-sans text-xs text-ink-muted mt-1 leading-relaxed">
            A refined version of the Guided Annual Planner is ready. Update now to refresh your journal shell, or continue writing and update later.
          </p>

          {pendingCount > 0 && (
            <p className="font-sans text-[11px] text-olive-dark mt-1 font-medium">
              Note: {pendingCount} pending offline change(s) will be preserved.
            </p>
          )}

          {errorMessage && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-terracotta bg-terracotta/10 border border-terracotta/20 rounded p-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage hover:bg-sage-dark text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isUpdating ? 'animate-spin motion-reduce:animate-none' : ''
                }`}
              />
              {isUpdating ? 'Updating...' : 'Update now'}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-paper hover:bg-paper-muted text-ink-muted text-xs font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss update banner"
          className="text-ink-light hover:text-ink transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
