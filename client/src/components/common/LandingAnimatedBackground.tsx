import React from 'react';
import { motion } from 'framer-motion';

export const LandingAnimatedBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
    >
      {/* Animated Landscape Watercolor Image with slow Ken-Burns pan and breath */}
      <motion.div
        initial={{ scale: 1, x: 0, y: 0 }}
        animate={{
          scale: [1, 1.06, 1],
          x: [0, -15, 0],
          y: [0, -8, 0],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 mix-blend-multiply"
        style={{
          backgroundImage: 'url(/images/landing-animated-bg.jpg)',
          filter: 'blur(0.5px) saturate(1.1)',
        }}
      />

      {/* Radiant Golden Dawn Light Aura (Breathing pulse) */}
      <motion.div
        animate={{
          opacity: [0.35, 0.65, 0.35],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-radial from-amber-100/70 via-sage-surface/40 to-transparent blur-3xl pointer-events-none"
      />

      {/* Floating Gentle Motes / Golden Paper Particles */}
      {[
        { id: 1, left: '12%', top: '25%', size: 6, delay: 0, duration: 14 },
        { id: 2, left: '28%', top: '60%', size: 8, delay: 3, duration: 18 },
        { id: 3, left: '45%', top: '35%', size: 5, delay: 1, duration: 16 },
        { id: 4, left: '68%', top: '50%', size: 7, delay: 4, duration: 20 },
        { id: 5, left: '82%', top: '20%', size: 6, delay: 2, duration: 15 },
        { id: 6, left: '90%', top: '65%', size: 8, delay: 5, duration: 22 },
      ].map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-300/40 blur-[1px]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -45, 0],
            x: [0, 15, -10, 0],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Gentle Bottom Paper Blend Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-paper/40 via-paper/70 to-paper" />
    </div>
  );
};
