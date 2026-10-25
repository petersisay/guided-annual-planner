import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface TrailDot {
  id: number;
  x: number;
  y: number;
  opacity: number;
  size: number;
}

export const GlobalCursorMovement: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(0);

  // Smooth spring physics for ambient cursor light halo
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const springConfig = { damping: 28, stiffness: 220, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Check if device supports fine hover (mouse/trackpad, not touch)
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const now = Date.now();
      const dist = Math.hypot(e.clientX - lastPosRef.current.x, e.clientY - lastPosRef.current.y);

      // Create animated movement trail dots when moving
      if (dist > 18 && now - lastTimeRef.current > 40) {
        lastTimeRef.current = now;
        lastPosRef.current = { x: e.clientX, y: e.clientY };

        const newDot: TrailDot = {
          id: now + Math.random(),
          x: e.clientX,
          y: e.clientY,
          opacity: 0.65,
          size: Math.min(8, Math.max(3, dist / 8)),
        };

        setTrail((prev) => [...prev.slice(-14), newDot]);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  // Clean up faded trail dots
  useEffect(() => {
    if (trail.length === 0) return;
    const timer = setTimeout(() => {
      setTrail((prev) => prev.slice(1));
    }, 120);
    return () => clearTimeout(timer);
  }, [trail]);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden select-none"
    >
      {/* Soft Ambient Light Glow following mouse movement */}
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
        }}
        className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-sage/15 blur-2xl pointer-events-none transition-opacity duration-300"
      />

      {/* Floating animated trail dots created on mouse movements */}
      {trail.map((dot) => (
        <span
          key={dot.id}
          className="absolute rounded-full pointer-events-none bg-amber-600/30 blur-[0.5px] transition-all duration-500 ease-out"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            transform: 'translate(-50%, -50%) scale(0.6)',
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
};
