import React, { useState } from 'react';
import { AlertTriangle, Download, Check, RefreshCw } from 'lucide-react';
import { ConflictPayload, ConflictResolutionStrategy } from '@planner/shared';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflict: ConflictPayload | null;
  localData: any;
  onResolve: (strategy: ConflictResolutionStrategy, mergedData?: any) => Promise<void>;
  onClose: () => void;
  onExportRescueBackup?: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  conflict,
  localData,
  onResolve,
  onClose,
  onExportRescueBackup,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolutionStrategy>('combine');
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen || !conflict) return null;

  const serverVersion: any = conflict.serverVersion;

  // Compute merged reflection and tasks if available
  const getMergedData = () => {
    if (!serverVersion || !localData) return localData;

    const merged = { ...localData };

    // Combine reflections if both exist and differ
    if (localData.reflection && serverVersion.reflection && localData.reflection !== serverVersion.reflection) {
      merged.reflection = `${localData.reflection}\n\n--- [Merged from other session] ---\n${serverVersion.reflection}`;
    } else if (!localData.reflection && serverVersion.reflection) {
      merged.reflection = serverVersion.reflection;
    }

    // Combine journal if present
    if (localData.journal && serverVersion.journal) {
      merged.journal = {
        ...localData.journal,
        wins:
          localData.journal.wins && serverVersion.journal.wins && localData.journal.wins !== serverVersion.journal.wins
            ? `${localData.journal.wins} | ${serverVersion.journal.wins}`
            : localData.journal.wins || serverVersion.journal.wins || '',
        challengesAndLessons:
          localData.journal.challengesAndLessons &&
          serverVersion.journal.challengesAndLessons &&
          localData.journal.challengesAndLessons !== serverVersion.journal.challengesAndLessons
            ? `${localData.journal.challengesAndLessons}\n${serverVersion.journal.challengesAndLessons}`
            : localData.journal.challengesAndLessons || serverVersion.journal.challengesAndLessons || '',
        freeWriting:
          localData.journal.freeWriting &&
          serverVersion.journal.freeWriting &&
          localData.journal.freeWriting !== serverVersion.journal.freeWriting
            ? `${localData.journal.freeWriting}\n\n--- [From other session] ---\n${serverVersion.journal.freeWriting}`
            : localData.journal.freeWriting || serverVersion.journal.freeWriting || '',
      };
    }

    return merged;
  };

  const handleConfirm = async () => {
    try {
      setIsResolving(true);
      const mergedData = selectedStrategy === 'combine' ? getMergedData() : undefined;
      await onResolve(selectedStrategy, mergedData);
      onClose();
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-paper border border-border rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3 border-b border-border pb-4">
          <div className="p-2 rounded-full bg-terracotta/10 text-terracotta shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 id="conflict-modal-title" className="text-xl font-serif font-bold text-ink">
              Sync Conflict Detected
            </h2>
            <p className="text-sm font-sans text-ink-muted mt-1">
              Changes were made to this planner spread from another device or session while you were working offline.
              Please review both versions and choose how to proceed.
            </p>
          </div>
        </div>

        {/* Side-by-side or comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
          <div className="p-4 rounded-lg bg-paper-alt border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">Your Local Version</span>
              <span className="text-xs bg-sage/20 text-sage-dark px-2 py-0.5 rounded">This device</span>
            </div>
            <div className="text-xs text-ink-muted">
              Intention / Focus: {localData?.intention || localData?.focus || '(None)'}
            </div>
            {localData?.reflection && (
              <div className="text-xs text-ink-muted line-clamp-3 bg-paper p-2 rounded border border-border-subtle italic">
                "{localData.reflection}"
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-paper-alt border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">Server Version</span>
              <span className="text-xs bg-gold/20 text-gold-dark px-2 py-0.5 rounded">Other session</span>
            </div>
            <div className="text-xs text-ink-muted">
              Intention / Focus: {serverVersion?.intention || serverVersion?.focus || '(None)'}
            </div>
            {serverVersion?.reflection && (
              <div className="text-xs text-ink-muted line-clamp-3 bg-paper p-2 rounded border border-border-subtle italic">
                "{serverVersion.reflection}"
              </div>
            )}
          </div>
        </div>

        {/* Resolution Strategies */}
        <div className="space-y-3 font-sans">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Choose Resolution Strategy
          </label>

          <div className="space-y-2">
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedStrategy === 'combine'
                  ? 'border-sage bg-sage-surface/40'
                  : 'border-border-subtle hover:bg-paper-alt'
              }`}
            >
              <input
                type="radio"
                name="conflictStrategy"
                value="combine"
                checked={selectedStrategy === 'combine'}
                onChange={() => setSelectedStrategy('combine')}
                className="mt-1 text-sage focus:ring-sage"
              />
              <div>
                <div className="font-semibold text-ink text-sm">Combine & Preserve Both (Recommended)</div>
                <div className="text-xs text-ink-muted">
                  Safely appends reflections and merges distinct notes so no writing or progress from either session is lost.
                </div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedStrategy === 'keep_local'
                  ? 'border-sage bg-sage-surface/40'
                  : 'border-border-subtle hover:bg-paper-alt'
              }`}
            >
              <input
                type="radio"
                name="conflictStrategy"
                value="keep_local"
                checked={selectedStrategy === 'keep_local'}
                onChange={() => setSelectedStrategy('keep_local')}
                className="mt-1 text-sage focus:ring-sage"
              />
              <div>
                <div className="font-semibold text-ink text-sm">Keep Local Version (Overwrite Server)</div>
                <div className="text-xs text-ink-muted">
                  Replaces the server copy with the changes made on this device.
                </div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedStrategy === 'keep_server'
                  ? 'border-sage bg-sage-surface/40'
                  : 'border-border-subtle hover:bg-paper-alt'
              }`}
            >
              <input
                type="radio"
                name="conflictStrategy"
                value="keep_server"
                checked={selectedStrategy === 'keep_server'}
                onChange={() => setSelectedStrategy('keep_server')}
                className="mt-1 text-sage focus:ring-sage"
              />
              <div>
                <div className="font-semibold text-ink text-sm">Keep Server Version (Discard Local)</div>
                <div className="text-xs text-ink-muted">
                  Discards the edits made on this device and accepts the latest server copy.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
          {onExportRescueBackup && (
            <button
              type="button"
              onClick={onExportRescueBackup}
              className="inline-flex items-center gap-1.5 text-xs font-sans text-ink-muted hover:text-ink underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Rescue Backup First
            </button>
          )}

          <div className="flex items-center gap-2 self-end sm:self-auto ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isResolving}
              className="px-4 py-2 text-sm font-sans font-medium rounded-lg border border-border text-ink hover:bg-paper-alt cursor-pointer transition-colors"
            >
              Review Later
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isResolving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-sans font-semibold rounded-lg bg-sage text-paper hover:bg-sage-dark cursor-pointer shadow-xs transition-colors"
            >
              {isResolving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Resolving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Apply Resolution
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
