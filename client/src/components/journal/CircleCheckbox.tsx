import React from 'react';

interface CircleCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  color?: 'sage' | 'ink';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export const CircleCheckbox: React.FC<CircleCheckboxProps> = ({
  checked,
  onChange,
  size = 'md',
  color = 'sage',
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  const strokeWidth = size === 'sm' ? 1.5 : 1.8;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel || 'Toggle task item'}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex items-center justify-center flex-shrink-0 cursor-pointer transition-transform active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage ${sizeClasses} ${className}`}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer drawn circle */}
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={`${
            checked
              ? color === 'sage'
                ? 'text-sage fill-sage/15'
                : 'text-ink fill-ink/10'
              : 'text-stone-700 hover:text-ink'
          } transition-colors`}
        />
        {/* Checked inner mark */}
        {checked && (
          <path
            d="M8 12.5L10.5 15L16 9"
            stroke={color === 'sage' ? '#7A9A48' : '#1A1A1A'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
};
