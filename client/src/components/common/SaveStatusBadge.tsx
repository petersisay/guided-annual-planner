import type { FC } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, CloudOff, AlertTriangle } from 'lucide-react';
import { SaveStatus } from '../../hooks/usePlanAutosave';

interface SaveStatusBadgeProps {
  status: SaveStatus;
  errorMessage?: string | null;
  onRetry?: () => void;
  onReviewConflict?: () => void;
  className?: string;
}

export const SaveStatusBadge: FC<SaveStatusBadgeProps> = ({
  status,
  errorMessage,
  onRetry,
  onReviewConflict,
  className = '',
}) => {
  if (status === 'idle') {
    return null;
  }

  const getBadgeStyle = () => {
    switch (status) {
      case 'saving':
      case 'syncing':
        return 'bg-paper-alt text-ink-muted border border-border-subtle';
      case 'saved':
        return 'bg-sage-surface text-sage border border-sage/30';
      case 'offline_saved':
        return 'bg-gold-light/30 text-amber-900 border border-gold/40';
      case 'conflict':
        return 'bg-terracotta/15 text-terracotta border border-terracotta/40 font-medium';
      case 'error':
      default:
        return 'bg-terracotta/10 text-terracotta border border-terracotta/30';
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-xs font-serif px-2.5 py-1 rounded-full transition-all motion-reduce:transition-none ${className} ${getBadgeStyle()}`}
    >
      {(status === 'saving' || status === 'syncing') && (
        <>
          <RefreshCw className="w-3 h-3 animate-spin motion-reduce:animate-none text-sage" />
          <span>{status === 'syncing' ? 'Syncing…' : 'Saving…'}</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
          <span>Synced to journal</span>
        </>
      )}

      {status === 'offline_saved' && (
        <>
          <CloudOff className="w-3.5 h-3.5 text-amber-800" />
          <span>Saved locally (offline)</span>
        </>
      )}

      {status === 'conflict' && (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-terracotta" />
          <span>Conflict detected</span>
          {onReviewConflict && (
            <button
              type="button"
              onClick={onReviewConflict}
              className="ml-1 underline font-semibold hover:text-ink cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-terracotta rounded px-1"
            >
              Resolve
            </button>
          )}
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-terracotta" />
          <span>{errorMessage || 'Sync failed'}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 underline font-semibold hover:text-ink cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-terracotta rounded px-1"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
};
