import type { FC } from 'react';
import { AlertTriangle, RefreshCw, BookOpen } from 'lucide-react';

interface PageLoadingProps {
  message?: string;
}

export const PageLoadingState: FC<PageLoadingProps> = ({
  message = 'Opening your journal pages...',
}) => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-[400px] flex flex-col items-center justify-center p-8 space-y-3"
  >
    <div className="w-9 h-9 border-2 border-sage border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
    <p className="font-serif text-sm text-ink-muted italic">{message}</p>
  </div>
);

interface PageErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const PageErrorState: FC<PageErrorProps> = ({
  title = 'Unable to Load Journal Page',
  message = 'We encountered an unexpected connection issue while retrieving your planner data.',
  onRetry,
}) => (
  <div
    role="alert"
    className="min-h-[350px] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4"
  >
    <div className="w-12 h-12 rounded-full bg-terracotta/10 border border-terracotta/20 flex items-center justify-center text-terracotta">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <div className="space-y-1">
      <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
      <p className="font-serif text-xs text-ink-muted leading-relaxed">{message}</p>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-sage hover:bg-sage-dark text-white text-xs font-serif rounded-lg transition-colors cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry Connection</span>
      </button>
    )}
  </div>
);

interface PageEmptyProps {
  title?: string;
  message?: string;
}

export const PageEmptyState: FC<PageEmptyProps> = ({
  title = 'No Entries Yet',
  message = 'Begin by typing your reflections, tasks, or habits into your journal.',
}) => (
  <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto space-y-3">
    <div className="w-12 h-12 rounded-full bg-paper-alt border border-border-subtle flex items-center justify-center text-ink-muted">
      <BookOpen className="w-5 h-5 text-sage" />
    </div>
    <h3 className="font-serif text-base font-semibold text-ink">{title}</h3>
    <p className="font-serif text-xs text-ink-muted">{message}</p>
  </div>
);
