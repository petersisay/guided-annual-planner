import React from 'react';

interface RuledInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const RuledInput: React.FC<RuledInputProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  disabled = false,
  onKeyDown,
}) => {
  return (
    <div className={`relative flex-1 ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-transparent border-b border-stone-300 focus:border-stone-800 text-ink text-sm sm:text-base font-serif px-1 py-0.5 focus:outline-none transition-colors placeholder:text-stone-300 placeholder:font-serif placeholder:italic"
      />
    </div>
  );
};

interface RuledLinesAreaProps {
  value: string;
  onChange: (value: string) => void;
  lines?: number;
  placeholder?: string;
  className?: string;
}

export const RuledLinesArea: React.FC<RuledLinesAreaProps> = ({
  value,
  onChange,
  lines = 4,
  placeholder = 'Write here...',
  className = '',
}) => {
  const lineHeightPx = 32;
  const minHeight = lines * lineHeightPx;

  return (
    <div
      className={`relative rounded-sm overflow-hidden bg-transparent ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(transparent, transparent ${lineHeightPx - 1}px, #e5e2db ${lineHeightPx - 1}px, #e5e2db ${lineHeightPx}px)`,
        backgroundSize: `100% ${lineHeightPx}px`,
        lineHeight: `${lineHeightPx}px`,
      }}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={lines}
        style={{
          minHeight: `${minHeight}px`,
          lineHeight: `${lineHeightPx}px`,
          paddingTop: '2px',
        }}
        className="w-full bg-transparent border-none resize-none focus:outline-none font-serif text-ink text-sm sm:text-base px-2 leading-[32px] placeholder:text-stone-300 placeholder:italic placeholder:font-serif"
      />
    </div>
  );
};
