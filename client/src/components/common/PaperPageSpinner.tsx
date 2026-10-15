import React from 'react';

interface PaperPageSpinnerProps {
  label?: string;
}

export const PaperPageSpinner: React.FC<PaperPageSpinnerProps> = ({
  label = 'Opening your journal spread...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="min-h-[60vh] flex flex-col items-center justify-center p-6"
    >
      <div className="relative mb-4 flex items-center justify-center">
        <img
          src="/images/gp-monogram.png"
          alt="GP Monogram"
          className="w-12 h-12 object-contain opacity-80 animate-pulse motion-reduce:animate-none"
        />
      </div>
      <div className="w-5 h-5 border-2 border-sage border-t-transparent rounded-full animate-spin motion-reduce:animate-none mb-3" />
      <p className="font-serif text-sm text-ink-muted tracking-wide">{label}</p>
    </div>
  );
};
