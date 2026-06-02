import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getThemeConfigSync, preloadThemes, getThemeConfigAsync } from '@/services/theme.service';
import { preloadFrames } from '@/services/frame.service';
import type { ThemeEffect, ThemeConfig } from '@/config/themes';
import { Droplet } from 'lucide-react';

const DynamicOverlay: React.FC<{
  effect: ThemeEffect;
  accent: string;
  layer?: 'base' | 'overlay';
  themeGroup?: string;
}> = ({ effect, accent, layer = 'base', themeGroup = 'normal' }) => {
  const [stars, setStars] = useState<Array<Record<string, string>>>([]);
  const [embers, setEmbers] = useState<Array<Record<string, string>>>([]);
  const [particles, setParticles] = useState<Array<Record<string, string>>>([]);
  const [ripples, setRipples] = useState<Array<Record<string, string>>>([]);
  const [snowflakes, setSnowflakes] = useState<Array<Record<string, string>>>([]);
  const [goldDust, setGoldDust] = useState<Array<Record<string, string>>>([]);
  const [digitalSparks, setDigitalSparks] = useState<Array<Record<string, string>>>([]);

  useEffect(() => {
    setTimeout(() => {
      const starCount = layer === 'overlay'
        ? (themeGroup === 'void' ? 80 : 25)
        : (themeGroup === 'void' ? 150 : 50);
      setStars([...Array(starCount)].map(() => {
        const isVoid = themeGroup === 'void';
        const size = Math.random() * (isVoid ? 4 : 3) + (isVoid && Math.random() > 0.8 ? 2 : 0);
        return {
          width: size + 'px',
          height: size + 'px',
          top: Math.random() * 100 + '%',
          left: Math.random() * 100 + '%',
          delay: Math.random() * 5 + 's',
          opacity: String(isVoid ? Math.random() * 0.4 + 0.6 : Math.random()),
          glow: isVoid && Math.random() > 0.7 ? '1' : '0',
        };
      }) as Record<string, string>[]);

      setEmbers([...Array(layer === 'overlay' ? 10 : 20)].map(() => ({
        width: Math.random() * 6 + 'px',
        height: Math.random() * 6 + 'px',
        left: Math.random() * 100 + '%',
        duration: (Math.random() * 5 + 5) + 's',
        delay: (Math.random() * 10) + 's',
      })));

      setParticles([...Array(layer === 'overlay' ? 8 : 15)].map(() => ({
        width: Math.random() * 10 + 5 + 'px',
        height: Math.random() * 10 + 5 + 'px',
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        duration: (Math.random() * 10 + 10) + 's',
        delay: (Math.random() * 5) + 's',
      })));

      setRipples([...Array(layer === 'overlay' ? 5 : 10)].map(() => ({
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        duration: (Math.random() * 4 + 4) + 's',
        delay: (Math.random() * 8) + 's',
      })));

      setSnowflakes([...Array(layer === 'overlay' ? 12 : 25)].map(() => ({
        size: Math.random() * 4 + 2 + 'px',
        left: Math.random() * 100 + '%',
        duration: (Math.random() * 6 + 6) + 's',
        delay: (Math.random() * 10) + 's',
        opacity: String(Math.random() * 0.6 + 0.2),
        drift: (Math.random() * 40 - 20) + 'px'
      })));

      setGoldDust([...Array(layer === 'overlay' ? 15 : 30)].map(() => ({
        size: Math.random() * 3 + 1 + 'px',
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        duration: (Math.random() * 8 + 4) + 's',
        delay: (Math.random() * 5) + 's',
        opacity: String(Math.random() * 0.7 + 0.3)
      })));

      setDigitalSparks([...Array(10)].map(() => ({
        width: Math.random() * 2 + 1 + 'px',
        height: Math.random() * 15 + 5 + 'px',
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        delay: Math.random() * 4 + 's',
        duration: Math.random() * 2 + 1 + 's'
      })));
    }, 0);
  }, [effect, layer]);

  if (effect === 'none' && themeGroup === 'normal') return null;

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${layer === 'overlay' ? 'z-[-1]' : 'z-[-2]'}`}
         style={{ opacity: layer === 'overlay' ? 0.3 : 0.4 }}>
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
                opacity: s.opacity,
                boxShadow: s.glow === '1' ? `0 0 ${parseFloat(s.width) * 3}px ${s.width} rgba(255,255,255,0.8)` : undefined,
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

      {/* ── Premium exclusive effects ── */}
      {effect === 'pearl-shimmer' && (
        <div className="absolute inset-0 overflow-hidden" style={{ mixBlendMode: 'overlay' as const }}>
          <div className="absolute inset-0 animate-shimmer-diagonal"
               style={{
                 background: `radial-gradient(ellipse 80% 50% at 50% 50%, ${accent}00 0%, ${accent} 50%, ${accent}00 100%)`,
                 backgroundSize: '200% 100%',
                 backgroundPosition: '0% 0%',
               }} />
        </div>
      )}

      {effect === 'silk-sweep' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 animate-silk-sweep"
               style={{
                 background: `linear-gradient(105deg, transparent 30%, ${accent}18 45%, ${accent}22 50%, ${accent}18 55%, transparent 70%)`,
                 backgroundSize: '200% 100%',
               }} />
        </div>
      )}

      {effect === 'canvas-texture' && (
        <div className="absolute inset-0"
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, ${accent}08 1px, transparent 0)`,
               backgroundSize: '24px 24px',
               opacity: 1,
             }} />
      )}

      {effect === 'depth-breathe' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 animate-breathe"
               style={{
                 background: `radial-gradient(circle at 50% 50%, ${accent}08 0%, transparent 70%)`,
                 transformOrigin: 'center',
               }} />
        </div>
      )}

      {/* ── Group Specific Background Elements ── */}
      {themeGroup === 'frost' && layer === 'base' && (
        <div className="absolute inset-0">
          {snowflakes.map((s, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full animate-snow-fall"
              style={{
                width: s.size,
                height: s.size,
                top: '-10px',
                left: s.left,
                animationDuration: s.duration,
                animationDelay: s.delay,
                '--snow-opacity': s.opacity,
                '--snow-drift': s.drift,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {themeGroup === 'royal' && layer === 'base' && (
        <div className="absolute inset-0">
          {goldDust.map((g, i) => (
            <div 
              key={i}
              className="absolute bg-amber-400 rounded-full animate-gold-dust"
              style={{
                width: g.size,
                height: g.size,
                top: '-20px',
                left: g.left,
                animationDuration: g.duration,
                animationDelay: g.delay,
                '--dust-opacity': g.opacity,
                boxShadow: '0 0 4px #f59e0b',
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {themeGroup === 'cyber' && layer === 'base' && (
        <div className="absolute inset-0 pointer-events-none">
          {digitalSparks.map((ds, i) => (
            <div 
              key={i}
              className="absolute rounded animate-digital-spark"
              style={{
                width: ds.width,
                height: ds.height,
                top: ds.top,
                left: ds.left,
                background: accent,
                animationDelay: ds.delay,
                animationDuration: ds.duration,
                boxShadow: `0 0 8px ${accent}`,
              }}
            />
          ))}
        </div>
      )}

      {themeGroup === 'void' && layer === 'base' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="void-vortex-bg" />
        </div>
      )}
    </div>
  );
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profile = useAppStore(state => state.profile);
  const themePreview = useAppStore(state => state.themePreview);
  const themeId = profile?.equipped_theme_id;

  const [activeThemeConfig, setActiveThemeConfig] = useState<ThemeConfig | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // Manage overlay fade out animation
  useEffect(() => {
    if (isChanging) {
      setShowOverlay(true);
    } else {
      const timer = setTimeout(() => setShowOverlay(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isChanging]);

  // Sync with profile themeId
  useEffect(() => {
    if (!themeId) {
      setActiveThemeConfig(null);
      return;
    }

    let cancelled = false;
    const syncConfig = getThemeConfigSync(themeId);

    if (syncConfig && syncConfig.id === themeId) {
      setActiveThemeConfig(syncConfig);
    } else {
      setIsChanging(true);
      getThemeConfigAsync(themeId).then(asyncConfig => {
        if (cancelled) return;
        if (asyncConfig) {
          setActiveThemeConfig(asyncConfig);
        }
      }).catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setTimeout(() => {
          setIsChanging(false);
        }, 400);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [themeId]);

  const theme = useMemo(() => {
    const base = activeThemeConfig || getThemeConfigSync(themeId);
    if (!themePreview) return base;
    return {
      ...base,
      ...themePreview,
      colors: { ...base.colors, ...(themePreview.colors || {}) },
    } as ThemeConfig;
  }, [activeThemeConfig, themeId, themePreview]);

  const themeGroup = useMemo(() => {
    if (!theme?.id) return 'normal';
    const id = theme.id;
    if (id.includes('aurora')) return 'aurora';
    if (id.includes('galaxy') || id.includes('nebula')) return 'cosmic';
    if (id.includes('storm') || id.includes('cyber') || id.includes('cyan')) return 'cyber';
    if (id.includes('royal') || id.includes('heaven') || id.includes('imperial')) return 'royal';
    if (id.includes('dragon') || id.includes('ember') || id.includes('red') || id.includes('crimson')) return 'fire';
    if (id.includes('frost') || id.includes('crystal')) return 'frost';
    if (id.includes('void') || id.includes('abyss')) return 'void';
    return 'normal';
  }, [theme?.id]);

  useEffect(() => {
    preloadThemes().catch(() => {});
    preloadFrames().catch(() => {});
  }, []);

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
      <DynamicOverlay 
        key={`${theme.id || 'default'}-base`}
        effect={theme.effect} 
        accent={theme.colors.accent} 
        layer="base" 
        themeGroup={themeGroup} 
      />
      {theme.overlayEffect && theme.overlayEffect !== 'none' && (
        <DynamicOverlay 
          key={`${theme.id || 'default'}-overlay`}
          effect={theme.overlayEffect} 
          accent={theme.colors.accent} 
          layer="overlay" 
          themeGroup={themeGroup} 
        />
      )}
      <div
        className="fixed inset-0 pointer-events-none z-[-2] opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${theme.colors.accent}30, transparent 70%)`,
          transition: 'background 1s ease-in-out'
        }}
      />
      {children}

      {showOverlay && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-auto transition-opacity duration-300 ${
            isChanging ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            background: 'rgba(9, 15, 30, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div 
                className="absolute inset-0 rounded-full blur-md animate-pulse"
                style={{ background: `var(--dw-accent, #3b82f6)`, opacity: 0.5 }}
              />
              <div 
                className="relative w-16 h-16 rounded-full flex items-center justify-center border border-white/10"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                }}
              >
                <Droplet 
                  className="w-8 h-8 animate-bounce" 
                  style={{ color: 'var(--dw-accent, #3b82f6)' }}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-white font-medium text-lg tracking-wide">
                Đang áp dụng giao diện...
              </h3>
              <p className="text-slate-400 text-sm max-w-[250px]">
                Đang đồng bộ hóa hiệu ứng và màu sắc hệ thống
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
