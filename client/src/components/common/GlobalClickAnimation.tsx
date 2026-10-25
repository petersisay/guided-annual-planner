import React, { useEffect, useState, useCallback } from 'react';

interface ClickRipple {
  id: number;
  x: number;
  y: number;
  color: string;
}

export const GlobalClickAnimation: React.FC = () => {
  const [ripples, setRipples] = useState<ClickRipple[]>([]);

  const handleClick = useCallback((e: MouseEvent) => {
    // Respect user preference for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Elegant warm earthy sage and terracotta color palette for click movement
    const colors = [
      'rgba(122, 154, 72, 0.45)', // Sage
      'rgba(200, 90, 72, 0.4)',   // Terracotta
      'rgba(217, 180, 74, 0.45)', // Amber
      'rgba(101, 130, 57, 0.5)',  // Olive
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newRipple: ClickRipple = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      color: randomColor,
    };

    setRipples((prev) => [...prev.slice(-12), newRipple]);

    // Clean up ripple after animation ends
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 750);
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [handleClick]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full border pointer-events-none animate-click-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            borderColor: ripple.color,
            boxShadow: `0 0 12px ${ripple.color}`,
          }}
        />
      ))}
    </div>
  );
};
