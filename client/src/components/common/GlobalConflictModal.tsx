import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, Check, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { syncManager } from '../../services/syncManager';
import { OfflineMutation } from '@planner/shared';

interface GlobalConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const GlobalConflictModal: React.FC<GlobalConflictModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [conflictedMutations, setConflictedMutations] = useState<OfflineMutation[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionChoice, setResolutionChoice] = useState<'keep_local' | 'keep_server'>('keep_local');

  useEffect(() => {
    if (isOpen) {
      syncManager.getConflictedMutations().then((list) => {
        setConflictedMutations(list);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResolve = async () => {
    try {
      setIsResolving(true);
      await syncManager.resolveAllConflicts(resolutionChoice);
      onClose();
      // Brief timeout to let sync finish before reloading fresh records
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error('Failed to resolve conflicts:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleExportBackup = () => {
    if (userId) {
      syncManager.exportUnsyncedData(userId);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-conflict-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-paper border border-border-strong rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-terracotta/15 text-terracotta shrink-0 border border-terracotta/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="global-conflict-title" className="text-lg font-serif font-bold text-ink leading-tight">
                Sync Conflict Detected
              </h2>
              <span className="text-xs text-ink-muted font-sans block mt-0.5">
                Review and save your offline notes {conflictedMutations.length > 0 && `(${conflictedMutations.length} queued)`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-paper-alt transition-colors cursor-pointer"
            aria-label="Close conflict dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Friendly Explanation */}
        <div className="p-3.5 bg-sage-surface/60 rounded-xl border border-sage/30 flex items-start gap-2.5 text-xs font-sans text-ink">
          <ShieldCheck className="w-4 h-4 text-forest shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-forest">Your work is safe on this device!</p>
            <p className="text-ink-muted leading-relaxed">
              While you were disconnected from the internet, your tasks were saved securely right here in your browser.
              When the internet reconnected, the cloud detected a timestamp difference. Choose which version you want to keep:
            </p>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="space-y-3 font-sans">
          {/* Option A: Keep My Offline Changes (Recommended) */}
          <label
            onClick={() => setResolutionChoice('keep_local')}
            className={`block p-3.5 rounded-xl border transition-all cursor-pointer ${
              resolutionChoice === 'keep_local'
                ? 'border-sage bg-paper-alt shadow-xs ring-1 ring-sage'
                : 'border-border-subtle hover:border-sage/40 bg-paper'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="conflictStrategy"
                checked={resolutionChoice === 'keep_local'}
                onChange={() => setResolutionChoice('keep_local')}
                className="mt-0.5 text-sage focus:ring-sage"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-semibold text-sm text-ink">
                    Keep My Offline Changes
                  </span>
                  <span className="text-[10px] bg-sage/20 text-forest font-semibold px-2 py-0.5 rounded-full font-sans">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-normal">
                  Overwrites the cloud with the tasks and notes you typed while offline, ensuring none of your recent work is lost.
                </p>
              </div>
            </div>
          </label>

          {/* Option B: Keep Cloud Version */}
          <label
            onClick={() => setResolutionChoice('keep_server')}
            className={`block p-3.5 rounded-xl border transition-all cursor-pointer ${
              resolutionChoice === 'keep_server'
                ? 'border-terracotta bg-paper-alt shadow-xs ring-1 ring-terracotta'
                : 'border-border-subtle hover:border-terracotta/40 bg-paper'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="conflictStrategy"
                checked={resolutionChoice === 'keep_server'}
                onChange={() => setResolutionChoice('keep_server')}
                className="mt-0.5 text-terracotta focus:ring-terracotta"
              />
              <div className="space-y-0.5">
                <span className="font-serif font-semibold text-sm text-ink block">
                  Keep Cloud Version
                </span>
                <p className="text-xs text-ink-muted leading-normal">
                  Discards the changes made on this device while offline and restores the latest version saved in your cloud account.
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-sans text-ink-muted hover:text-ink border border-border-subtle rounded-xl hover:bg-paper-alt transition-colors cursor-pointer"
            title="Download your unsynced edits as a backup file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Backup (.json)</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isResolving}
              className="w-1/2 sm:w-auto px-4 py-2 text-xs font-sans text-ink-muted hover:text-ink rounded-xl border border-border-subtle hover:bg-paper-alt transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResolve}
              disabled={isResolving}
              className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-sage hover:bg-sage-dark text-white text-xs font-serif font-semibold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isResolving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply & Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
