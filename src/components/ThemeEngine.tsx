import { useEffect, useState } from 'react';
import type { Profile } from '../models';
import { readThemePreference } from '@/services/appPreferences.service';
import { getThemeConfigSync, getThemeConfigAsync } from '@/services/theme.service';
import type { ThemeConfig } from '@/config/themes';

export default function ThemeEngine({ profile }: { profile: Profile | null }) {
  const [themeColor, setThemeColor] = useState<string>('#06b6d4'); // Mặc định Cyan
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    const themeId = profile.equipped_theme_id;

    if (themeId && themeId !== 'theme_default') {
      // 1. Thử sync trước để không gọi DB không cần thiết
      const syncConfig = getThemeConfigSync(themeId);
      if (syncConfig && syncConfig.id === themeId) {
        setThemeColor(syncConfig.colors?.accent || '#06b6d4');
        setThemeConfig(syncConfig);
      } else {
        // 2. Fallback async nếu chưa cache
        getThemeConfigAsync(themeId).then(config => {
          if (cancelled) return;
          if (config) {
            setThemeColor(config.colors?.accent || '#06b6d4');
            setThemeConfig(config);
          }
        }).catch(() => {
          if (cancelled) return;
          const fallback = getThemeConfigSync(themeId);
          setThemeColor(fallback?.colors?.accent || '#06b6d4');
          setThemeConfig(fallback);
        });
      }
    } else {
      setThemeColor(readThemePreference(profile.id));
      setThemeConfig(null); // Reset custom theme config
    }

    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile?.equipped_theme_id]);

  useEffect(() => {
    const root = document.documentElement;
    const classesToRemove: string[] = [];
    Array.from(root.classList).forEach(className => {
      if (className.startsWith('theme-group-') || className.startsWith('theme-id-')) {
        classesToRemove.push(className);
      }
    });
    classesToRemove.forEach(className => root.classList.remove(className));

    if (themeConfig?.id) {
      const id = themeConfig.id;
      let group = 'normal';
      if (id.includes('aurora')) group = 'aurora';
      else if (id.includes('galaxy') || id.includes('nebula')) group = 'cosmic';
      else if (id.includes('storm') || id.includes('cyber') || id.includes('cyan')) group = 'cyber';
      else if (id.includes('royal') || id.includes('heaven') || id.includes('imperial')) group = 'royal';
      else if (id.includes('dragon') || id.includes('ember') || id.includes('red') || id.includes('crimson')) group = 'fire';
      else if (id.includes('frost') || id.includes('crystal')) group = 'frost';
      else if (id.includes('void') || id.includes('abyss')) group = 'void';
      
      root.classList.add(`theme-group-${group}`);
      root.classList.add(`theme-id-${id}`);
    } else {
      root.classList.add('theme-group-normal');
    }
  }, [themeConfig]);

  // Nếu màu là màu mặc định (Cyan) và không có theme config thì không cần ghi đè
  if (!themeColor || (themeColor === '#06b6d4' && !themeConfig)) return null;

  const {
    colors,
    blurLevel = '20px',
    borderRadius = '16px',
    borderWidth = '1px',
    glassPattern = 'none',
    glassGlowIntensity = 0.15,
    glassGradient,
  } = themeConfig || {};

  return (
    <style>
      {`
        :root {
          --neon-cyan: ${themeColor} !important;
          --theme-blur: ${blurLevel};
          --theme-border-radius: ${borderRadius};
          --theme-border-radius-inner: calc(${borderRadius} - 8px);
          --theme-border-width: ${borderWidth};
          --theme-surface-glass: ${colors?.surfaceGlass || 'rgba(34,211,238,0.04)'};
          --theme-border-glass: ${colors?.borderGlass || 'rgba(34,211,238,0.1)'};
          --theme-glow-color: ${colors?.glowColor || 'rgba(34,211,238,0.15)'};
          --theme-glow-intensity: ${glassGlowIntensity};
          --theme-glass-gradient: ${glassGradient || 'none'};
          --theme-glass-pattern: ${glassPattern};
        }
        
        /* Ghi đè Text, Background, Border */
        .text-cyan-400, .text-cyan-500, .text-cyan-600 { color: ${themeColor} !important; }
        .bg-cyan-400, .bg-cyan-500, .bg-cyan-600 { background-color: ${themeColor} !important; }
        .border-cyan-400, .border-cyan-500, .border-cyan-600 { border-color: ${themeColor} !important; }
        
        /* Ghi đè Gradient */
        .from-cyan-400, .from-cyan-500, .from-cyan-600 { --tw-gradient-from: ${themeColor} !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
        .to-cyan-400, .to-cyan-500, .to-cyan-600 { --tw-gradient-to: ${themeColor} !important; }
        
        /* Ghi đè các thẻ có Opacity (VD: bg-cyan-500/20) - Rất quan trọng để UI không bị gãy */
        .bg-cyan-500\\/10 { background-color: ${themeColor}1a !important; }
        .bg-cyan-500\\/15 { background-color: ${themeColor}26 !important; }
        .bg-cyan-500\\/20 { background-color: ${themeColor}33 !important; }
        .bg-cyan-500\\/30 { background-color: ${themeColor}4d !important; }
        .border-cyan-500\\/20 { border-color: ${themeColor}33 !important; }
        .border-cyan-500\\/30 { border-color: ${themeColor}4d !important; }
        .border-cyan-500\\/50 { border-color: ${themeColor}80 !important; }

        /* ==========================================
           LEGENDARY & PREMIUM CUSTOM THEME EFFECTS
           ========================================== */

        /* --- ROYAL THEME (Gold Sweep & Metallic Glow) --- */
        @keyframes gold-sweep {
          0% { transform: translateX(-150%) skewX(-15deg); }
          50% { transform: translateX(150%) skewX(-15deg); }
          100% { transform: translateX(150%) skewX(-15deg); }
        }
        .theme-group-royal .glass-card,
        .theme-group-royal .glass-card-strong {
          position: relative;
          overflow: hidden;
          border-color: rgba(245, 158, 11, 0.4) !important;
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
        }
        .theme-group-royal .glass-card::after,
        .theme-group-royal .glass-card-strong::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(253, 224, 71, 0.2) 20%,
            rgba(253, 224, 71, 0.4) 50%,
            rgba(253, 224, 71, 0.2) 80%,
            transparent 100%
          );
          transform: translateX(-150%) skewX(-15deg);
          animation: gold-sweep 6s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }

        /* --- CYBER / STORM THEME (Flickering Neon & Sharp Edges) --- */
        @keyframes cyber-glitch {
          0%, 100% { border-color: var(--neon-cyan); box-shadow: 0 0 8px var(--neon-cyan); }
          92% { border-color: var(--neon-cyan); box-shadow: 0 0 8px var(--neon-cyan); }
          93% { border-color: rgba(232, 121, 249, 0.2); box-shadow: none; }
          94% { border-color: var(--neon-cyan); box-shadow: 0 0 12px var(--neon-cyan); }
          95% { border-color: rgba(232, 121, 249, 0.2); box-shadow: none; }
          96% { border-color: var(--neon-cyan); box-shadow: 0 0 8px var(--neon-cyan); }
        }
        .theme-group-cyber .glass-card,
        .theme-group-cyber .glass-card-strong {
          animation: cyber-glitch 5s step-end infinite;
        }

        /* --- FIRE THEME (Breathing Magma) --- */
        @keyframes magma-breathe {
          0%, 100% { 
            border-color: rgba(239, 68, 68, 0.4); 
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.2), inset 0 1px 1px rgba(239, 68, 68, 0.1); 
          }
          50% { 
            border-color: rgba(249, 115, 22, 0.8); 
            box-shadow: 0 0 20px rgba(249, 115, 22, 0.5), inset 0 1px 2px rgba(249, 115, 22, 0.2); 
          }
        }
        .theme-group-fire .glass-card,
        .theme-group-fire .glass-card-strong {
          animation: magma-breathe 4s ease-in-out infinite;
        }

        /* --- FROST THEME (Frozen Ice Glint) --- */
        @keyframes frost-shimmer {
          0%, 100% { border-color: rgba(103, 232, 249, 0.3); box-shadow: 0 0 10px rgba(103, 232, 249, 0.15); }
          50% { border-color: rgba(103, 232, 249, 0.7); box-shadow: 0 0 20px rgba(103, 232, 249, 0.4); }
        }
        .theme-group-frost .glass-card,
        .theme-group-frost .glass-card-strong {
          position: relative;
          background: rgba(10, 25, 41, 0.75) !important;
          animation: frost-shimmer 5s ease-in-out infinite;
        }
        .theme-group-frost .glass-card::before,
        .theme-group-frost .glass-card-strong::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(103, 232, 249, 0.05) 0%, transparent 40%, transparent 60%, rgba(103, 232, 249, 0.05) 100%);
          pointer-events: none;
          z-index: 0;
        }

        /* --- AURORA THEME (Shifting Rainbow Border) --- */
        @keyframes aurora-border {
          0% { border-color: rgba(167, 139, 250, 0.4); box-shadow: 0 0 10px rgba(167, 139, 250, 0.2); }
          33% { border-color: rgba(52, 211, 153, 0.4); box-shadow: 0 0 10px rgba(52, 211, 153, 0.2); }
          66% { border-color: rgba(34, 211, 238, 0.4); box-shadow: 0 0 10px rgba(34, 211, 238, 0.2); }
          100% { border-color: rgba(167, 139, 250, 0.4); box-shadow: 0 0 10px rgba(167, 139, 250, 0.2); }
        }
        .theme-group-aurora .glass-card,
        .theme-group-aurora .glass-card-strong {
          animation: aurora-border 10s linear infinite;
        }

        /* --- VOID THEME (Zero Borders & Deep Spread Shadow) --- */
        .theme-group-void .glass-card,
        .theme-group-void .glass-card-strong {
          border: none !important;
          box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(67, 56, 202, 0.2) !important;
          background: rgba(3, 3, 10, 0.94) !important;
        }

        /* --- COSMIC THEME (Starry Shimmer & Nebula Glow) --- */
        @keyframes cosmic-shimmer {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        .theme-group-cosmic .glass-card,
        .theme-group-cosmic .glass-card-strong {
          position: relative;
          border-color: rgba(109, 40, 217, 0.3) !important;
          box-shadow: 0 0 20px rgba(109, 40, 217, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15) !important;
        }
        .theme-group-cosmic .glass-card::before,
        .theme-group-cosmic .glass-card-strong::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 0%, rgba(167, 139, 250, 0.1), transparent 70%);
          pointer-events: none;
          animation: cosmic-shimmer 4s ease-in-out infinite;
          z-index: 0;
        }

        /* --- BACKGROUND ANIMATIONS FOR OVERLAYS --- */
        @keyframes snow-fall {
          0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: var(--snow-opacity, 0.8); }
          90% { opacity: var(--snow-opacity, 0.8); }
          100% { transform: translateY(105vh) translateX(var(--snow-drift, 20px)) rotate(360deg); opacity: 0; }
        }
        .animate-snow-fall {
          animation: snow-fall linear infinite;
        }

        @keyframes gold-dust-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          20% { opacity: var(--dust-opacity, 0.6); }
          80% { opacity: var(--dust-opacity, 0.6); }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
        .animate-gold-dust {
          animation: gold-dust-fall linear infinite;
        }

        @keyframes digital-spark-blink {
          0%, 100% { opacity: 0; transform: scaleY(0); }
          50% { opacity: 0.8; transform: scaleY(1); }
        }
        .animate-digital-spark {
          animation: digital-spark-blink ease-in-out infinite;
        }

        @keyframes real-star {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          25% { opacity: 0.9; transform: scale(1.1); }
          50% { opacity: 0.6; transform: scale(1); }
          75% { opacity: 1; transform: scale(1.15); }
        }
        .animate-real-star {
          animation: real-star ease-in-out infinite;
        }

        @keyframes shooting-star {
          0% { transform: translateX(0) translateY(0) rotate(var(--shoot-angle, 20deg)); opacity: 0; }
          10% { opacity: 1; }
          20% { opacity: 1; }
          100% { transform: translateX(300px) translateY(150px) rotate(var(--shoot-angle, 20deg)); opacity: 0; }
        }
        .animate-shooting-star {
          animation: shooting-star linear infinite;
          opacity: 0;
        }

        @keyframes void-vortex {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .void-vortex-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 80vmax;
          height: 80vmax;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, #000 20%, rgba(67, 56, 202, 0.1) 40%, transparent 70%);
          filter: blur(20px);
          animation: void-vortex 40s linear infinite;
          pointer-events: none;
          z-index: -1;
        }
      `}
    </style>
  );
}
