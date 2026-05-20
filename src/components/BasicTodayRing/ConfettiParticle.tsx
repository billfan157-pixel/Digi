import React, { useState } from 'react';

interface ConfettiParticleProps {
  delay: number;
  index: number;
}

export function ConfettiParticle({ delay, index }: ConfettiParticleProps) {
  const [styleData] = useState(() => {
    const colors = ['#22d3ee', '#34d399', '#fbbf24', '#38bdf8'];
    return {
      color: colors[index % colors.length],
      x: Math.random() * 200 - 100,
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.7 + 0.5,
    };
  });

  return (
    <div
      className="absolute rounded-full opacity-0"
      style={
        {
          width: `${styleData.scale * 6}px`,
          height: `${styleData.scale * 6}px`,
          backgroundColor: styleData.color,
          animation: `confetti-fall 1.6s ease-out ${delay}s forwards`,
          '--x': `${styleData.x}px`,
          '--rotation': `${styleData.rotation}deg`,
        } as React.CSSProperties
      }
    />
  );
}
