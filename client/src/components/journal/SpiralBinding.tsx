import React from 'react';

interface SpiralBindingProps {
  position?: 'left' | 'right' | 'top';
  className?: string;
  count?: number;
}

export const SpiralBinding: React.FC<SpiralBindingProps> = ({
  position = 'left',
  className = '',
  count = 24,
}) => {
  const isHorizontal = position === 'top';

  return (
    <div
      aria-hidden="true"
      className={`select-none pointer-events-none flex ${
        isHorizontal
          ? 'flex-row justify-around items-center w-full h-8 px-6'
          : 'flex-col justify-around items-center h-full w-8 py-6'
      } ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`relative flex items-center justify-center ${
            isHorizontal ? 'h-full w-4' : 'w-full h-4'
          }`}
        >
          {/* Paper cutout punch hole */}
          <div
            className={`bg-[#2c2b29] rounded-sm shadow-inner ${
              isHorizontal ? 'w-2 h-4' : 'w-4 h-2'
            }`}
          />
          {/* Wire spiral loop highlights */}
          <div
            className={`absolute bg-gradient-to-r from-stone-400 via-stone-200 to-stone-500 rounded-full opacity-80 ${
              isHorizontal
                ? 'w-1.5 h-6 -top-1'
                : 'h-1.5 w-6 -left-1'
            }`}
            style={{
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      ))}
    </div>
  );
};
