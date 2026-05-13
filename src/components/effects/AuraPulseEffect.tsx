import React from 'react';
import { motion } from 'framer-motion';

interface AuraPulseEffectProps {
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  intensity?: number;
  className?: string;
}

export const AuraPulseEffect: React.FC<AuraPulseEffectProps> = ({ 
  color, 
  size = 'md', 
  intensity = 1,
  className = '' 
}) => {
  const sizeMap = {
    sm: 'w-24 h-24 blur-xl',
    md: 'w-48 h-48 blur-2xl',
    lg: 'w-64 h-64 blur-3xl',
    xl: 'w-96 h-96 blur-[80px]'
  };

  return (
    <div className={`pointer-events-none relative flex items-center justify-center ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15 * intensity, 0.3 * intensity, 0.15 * intensity],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute rounded-full ${sizeMap[size]}`}
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        }}
      />
      <motion.div
        animate={{
          scale: [1.2, 1.4, 1.2],
          opacity: [0.05 * intensity, 0.1 * intensity, 0.05 * intensity],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className={`absolute rounded-full ${sizeMap[size]}`}
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
};
