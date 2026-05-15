import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getThemeConfig } from '@/config/themes';
import type { ThemeEffect } from '@/config/themes';

const DynamicOverlay: React.FC<{ effect: ThemeEffect; accent: string }> = ({ effect, accent }) => {
  // Fix React Purity: Use State + Effect to generate random values safely after mount
  const [stars, setStars] = useState<Array<Record<string, string>>>([]);
  const [embers, setEmbers] = useState<Array<Record<string, string>>>([]);
  const [particles, setParticles] = useState<Array<Record<string, string>>>([]);
  const [ripples, setRipples] = useState<Array<Record<string, string>>>([]);

  useEffect(() => {
    // Generate only once on mount
    setTimeout(() => {
      setStars([...Array(50)].map(() => ({
        width: Math.random() * 3 + 'px',
        height: Math.random() * 3 + 'px',
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        delay: Math.random() * 5 + 's',
        opacity: String(Math.random())
      })) as Record<string, string>[]);

      setEmbers([...Array(20)].map(() => ({
        width: Math.random() * 6 + 'px',
        height: Math.random() * 6 + 'px',
        left: Math.random() * 100 + '%',
        duration: (Math.random() * 5 + 5) + 's',
        delay: (Math.random() * 10) + 's',
      })));

      setParticles([...Array(15)].map(() => ({
        width: Math.random() * 10 + 5 + 'px',
        height: Math.random() * 10 + 5 + 'px',
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        duration: (Math.random() * 10 + 10) + 's',
        delay: (Math.random() * 5) + 's',
      })));

      setRipples([...Array(10)].map(() => ({
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        duration: (Math.random() * 4 + 4) + 's',
        delay: (Math.random() * 8) + 's',
      })));
    }, 0);
  }, []);

  if (effect === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-40">
      {effect === 'cyber-grid' && (
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${accent}20 1px, transparent 1px), linear-gradient(90deg, ${accent}20 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg) translateY(-100px)',
            transformOrigin: 'top',
            animation: 'cyber-grid-move 20s linear infinite'
          }}
        />
      )}

      {effect === 'aurora-waves' && (
        <div className="absolute inset-0">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-30 animate-aurora-slow blur-[60px]"
               style={{ background: `conic-gradient(from 180deg at 50% 50%, ${accent}00, ${accent}40, ${accent}00, ${accent}40, ${accent}00)` }} />
        </div>
      )}

      {effect === 'space-stars' && (
        <div className="absolute inset-0">
          {stars.map((s, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full animate-twinkle"
              style={{
                width: s.width,
                height: s.height,
                top: s.top,
                left: s.left,
                animationDelay: s.delay,
                opacity: s.opacity
              }}
            />
          ))}
        </div>
      )}

      {effect === 'fire-embers' && (
        <div className="absolute inset-0">
          {embers.map((e, i) => (
            <div 
              key={i}
              className="absolute rounded-full blur-[1px] animate-float-up"
              style={{
                width: e.width,
                height: e.height,
                background: accent,
                bottom: '-20px',
                left: e.left,
                animationDuration: e.duration,
                animationDelay: e.delay,
                boxShadow: `0 0 10px ${accent}`
              }}
            />
          ))}
        </div>
      )}

      {effect === 'golden-rays' && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 animate-ray-sweep"
               style={{ background: `linear-gradient(45deg, transparent 40%, ${accent} 50%, transparent 60%)`, backgroundSize: '200% 200%' }} />
        </div>
      )}

      {effect === 'floating-particles' && (
        <div className="absolute inset-0">
          {particles.map((p, i) => (
            <div 
              key={i}
              className="absolute animate-float-around opacity-60"
              style={{
                width: p.width,
                height: p.height,
                background: accent,
                borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                top: p.top,
                left: p.left,
                animationDuration: p.duration,
                animationDelay: p.delay,
                filter: 'blur(1px)'
              }}
            />
          ))}
        </div>
      )}

      {effect === 'water-ripples' && (
        <div className="absolute inset-0">
          {ripples.map((r, i) => (
            <div 
              key={i}
              className="absolute border border-white/20 rounded-full animate-ripple-out"
              style={{
                width: '100px',
                height: '100px',
                top: r.top,
                left: r.left,
                animationDuration: r.duration,
                animationDelay: r.delay,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profile = useAppStore(state => state.profile);
  const themeId = profile?.equipped_theme_id;
  const theme = useMemo(() => getThemeConfig(themeId), [themeId]);

  useEffect(() => {
    const root = document.documentElement;
    const { colors, blurLevel, borderRadius, borderWidth } = theme;

    root.style.setProperty('--dw-accent', colors.accent);
    root.style.setProperty('--dw-accent-contrast', colors.accentContrast);
    root.style.setProperty('--dw-surface-1', colors.surface1);
    root.style.setProperty('--dw-surface-2', colors.surface2);
    root.style.setProperty('--dw-surface-3', colors.surface3);
    root.style.setProperty('--dw-surface-glass', colors.surfaceGlass);
    root.style.setProperty('--dw-border-glass', colors.borderGlass);
    root.style.setProperty('--dw-bg-gradient', colors.bgGradient);
    root.style.setProperty('--dw-glow-color', colors.glowColor);
    root.style.setProperty('--dw-blur-level', blurLevel);
    
    root.style.setProperty('--dw-radius-card', borderRadius);
    root.style.setProperty('--dw-border-width', borderWidth);

    document.body.style.background = colors.bgGradient;
  }, [theme]);

  return (
    <>
      <DynamicOverlay effect={theme.effect} accent={theme.colors.accent} />
      <div 
        className="fixed inset-0 pointer-events-none z-[-2] opacity-30"
        style={{ 
          background: `radial-gradient(circle at 50% 0%, ${theme.colors.accent}30, transparent 70%)`,
          transition: 'background 1s ease-in-out'
        }} 
      />
      {children}
    </>
  );
};
