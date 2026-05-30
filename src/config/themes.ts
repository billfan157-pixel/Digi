import i18n from '@/i18n';

export interface ThemeColors {
  accent: string;
  accentContrast: string;
  surface1: string;
  surface2: string;
  surface3: string;
  surfaceGlass: string;
  borderGlass: string;
  bgGradient: string;
  glowColor: string;
}

export type ThemeEffect = 'none' | 'cyber-grid' | 'aurora-waves' | 'space-stars' | 'floating-particles' | 'fire-embers' | 'water-ripples' | 'golden-rays' | 'pearl-shimmer' | 'silk-sweep' | 'canvas-texture' | 'depth-breathe';

export type GlassPattern = 'none' | 'gradient' | 'grid' | 'scanline' | 'diagonal' | 'satin' | 'lens';
export type GlassHoverEffect = 'brightness' | 'opacity' | 'scale' | 'glow';

export interface ThemeConfig {
  id: string;
  name: string;
  colors: ThemeColors;
  blurLevel: string;
  effect: ThemeEffect;
  overlayEffect?: ThemeEffect; // Premium-only: second effect layer
  borderRadius: string;
  borderWidth: string;
  glassOpacity: string;
  // Glass-specific variables
  glassPattern: GlassPattern;
  glassGlowIntensity: number; // 0-1
  glassInnerGlow: boolean;
  glassGradient?: string; // Optional gradient overlay
  glassHoverEffect: GlassHoverEffect;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export const APP_THEMES: Record<string, ThemeConfig> = {
  theme_default: {
    id: 'theme_default', name: i18n.t('themes.theme_default'), blurLevel: '20px', effect: 'none', borderRadius: '16px', borderWidth: '1px', glassOpacity: '0.04',
    colors: { accent: '#22d3ee', accentContrast: '#06121a', surface1: 'rgba(34,211,238,0.03)', surface2: 'rgba(34,211,238,0.05)', surface3: 'rgba(34,211,238,0.08)', surfaceGlass: 'rgba(34,211,238,0.04)', borderGlass: 'rgba(34,211,238,0.1)', bgGradient: 'radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 100%)', glowColor: 'rgba(34,211,238,0.15)' },
    glassPattern: 'none', glassGlowIntensity: 0.15, glassInnerGlow: false, glassHoverEffect: 'opacity'
  },
  theme_water: {
    id: 'theme_water', name: i18n.t('themes.theme_water'), blurLevel: '16px', effect: 'water-ripples', borderRadius: '16px', borderWidth: '1.5px', glassOpacity: '0.06',
    colors: { accent: '#0ea5e9', accentContrast: '#ffffff', surface1: 'rgba(14,165,233,0.05)', surface2: 'rgba(14,165,233,0.08)', surface3: 'rgba(14,165,233,0.12)', surfaceGlass: 'rgba(14,165,233,0.06)', borderGlass: 'rgba(14,165,233,0.2)', bgGradient: 'radial-gradient(circle at 50% 0%, #0c4a6e 0%, #020617 100%)', glowColor: 'rgba(14,165,233,0.15)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.2, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(14,165,233,0.1), transparent)', glassHoverEffect: 'brightness'
  },
  theme_jade: {
    id: 'theme_jade', name: i18n.t('themes.theme_jade'), blurLevel: '24px', effect: 'floating-particles', borderRadius: '16px', borderWidth: '1px', glassOpacity: '0.05',
    colors: { accent: '#10b981', accentContrast: '#ffffff', surface1: 'rgba(16,185,129,0.05)', surface2: 'rgba(16,185,129,0.08)', surface3: 'rgba(16,185,129,0.12)', surfaceGlass: 'rgba(16,185,129,0.06)', borderGlass: 'rgba(16,185,129,0.2)', bgGradient: 'linear-gradient(180deg, #064e3b 0%, #020617 100%)', glowColor: 'rgba(16,185,129,0.25)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.25, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(16,185,129,0.1), transparent)', glassHoverEffect: 'brightness'
  },
  theme_imperial: {
    id: 'theme_imperial', name: i18n.t('themes.theme_imperial'), blurLevel: '24px', effect: 'golden-rays', borderRadius: '16px', borderWidth: '3px', glassOpacity: '0.1',
    colors: { accent: '#eab308', accentContrast: '#422006', surface1: 'rgba(234,179,8,0.08)', surface2: 'rgba(234,179,8,0.12)', surface3: 'rgba(234,179,8,0.16)', surfaceGlass: 'rgba(234,179,8,0.1)', borderGlass: '#eab308', bgGradient: 'conic-gradient(from 180deg at 50% 0%, #422006, #713f12, #020617, #713f12, #422006)', glowColor: 'rgba(234,179,8,0.4)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.4, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(234,179,8,0.2), transparent)', glassHoverEffect: 'glow'
  },
  theme_violet: {
    id: 'theme_violet', name: i18n.t('themes.theme_violet'), blurLevel: '30px', effect: 'space-stars', borderRadius: '16px', borderWidth: '1px', glassOpacity: '0.04',
    colors: { accent: '#7c3aed', accentContrast: '#ffffff', surface1: 'rgba(124,58,237,0.05)', surface2: 'rgba(124,58,237,0.08)', surface3: 'rgba(124,58,237,0.12)', surfaceGlass: 'rgba(124,58,237,0.06)', borderGlass: 'rgba(124,58,237,0.15)', bgGradient: 'linear-gradient(180deg, #3b0764 0%, #020617 100%)', glowColor: 'rgba(124,58,237,0.2)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.2, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(124,58,237,0.1), transparent)', glassHoverEffect: 'brightness'
  },
  theme_crimson: {
    id: 'theme_crimson', name: i18n.t('themes.theme_crimson'), blurLevel: '20px', effect: 'fire-embers', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.06',
    colors: { accent: '#f43f5e', accentContrast: '#ffffff', surface1: 'rgba(244,63,94,0.05)', surface2: 'rgba(244,63,94,0.08)', surface3: 'rgba(244,63,94,0.12)', surfaceGlass: 'rgba(244,63,94,0.06)', borderGlass: '#f43f5e', bgGradient: 'radial-gradient(circle at 50% -10%, #4c0519 0%, #020617 100%)', glowColor: 'rgba(244,63,94,0.3)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.3, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(244,63,94,0.1), transparent)', glassHoverEffect: 'glow'
  },
  theme_abyss: {
    id: 'theme_abyss', name: i18n.t('themes.theme_abyss'), rarity: 'legendary', blurLevel: '40px', effect: 'space-stars', borderRadius: '16px', borderWidth: '0px', glassOpacity: '0.8',
    colors: { accent: '#6366f1', accentContrast: '#ffffff', surface1: 'rgba(99,102,241,0.06)', surface2: 'rgba(99,102,241,0.1)', surface3: 'rgba(99,102,241,0.14)', surfaceGlass: 'rgba(0,0,0,0.85)', borderGlass: 'rgba(99,102,241,0.4)', bgGradient: 'black', glowColor: 'rgba(99,102,241,0.6)' },
    glassPattern: 'none', glassGlowIntensity: 0.6, glassInnerGlow: true, glassHoverEffect: 'glow'
  },
  theme_aurora: {
    id: 'theme_aurora', name: i18n.t('themes.theme_aurora'), rarity: 'legendary', blurLevel: '22px', effect: 'aurora-waves', borderRadius: '16px', borderWidth: '1px', glassOpacity: '0.05',
    colors: { accent: '#a78bfa', accentContrast: '#ffffff', surface1: 'rgba(167,139,250,0.06)', surface2: 'rgba(167,139,250,0.09)', surface3: 'rgba(167,139,250,0.12)', surfaceGlass: 'rgba(167,139,250,0.08)', borderGlass: 'rgba(255,255,255,0.25)', bgGradient: 'conic-gradient(from 180deg at 50% 0%, #1e1b4b, #2e1065, #020617, #083344, #1e1b4b)', glowColor: 'rgba(167,139,250,0.3)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.45, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(167,139,250,0.2), rgba(232,121,249,0.1), transparent)', glassHoverEffect: 'brightness'
  },
  theme_cyan: {
    id: 'theme_cyan', name: i18n.t('themes.theme_cyan'), blurLevel: '14px', effect: 'cyber-grid', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.1',
    colors: { accent: '#06b6d4', accentContrast: '#ffffff', surface1: 'rgba(6,182,212,0.08)', surface2: 'rgba(6,182,212,0.12)', surface3: 'rgba(6,182,212,0.16)', surfaceGlass: 'rgba(6,182,212,0.1)', borderGlass: '#06b6d4', bgGradient: 'radial-gradient(circle at 50% -20%, #083344 0%, #020617 100%)', glowColor: 'rgba(6,182,212,0.5)' },
    glassPattern: 'grid', glassGlowIntensity: 0.45, glassInnerGlow: false, glassHoverEffect: 'glow'
  },
  theme_cyber: {
    id: 'theme_cyber', name: i18n.t('themes.theme_cyber'), blurLevel: '10px', effect: 'cyber-grid', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.12',
    colors: { accent: '#e879f9', accentContrast: '#000000', surface1: 'rgba(232,121,249,0.08)', surface2: 'rgba(232,121,249,0.12)', surface3: 'rgba(232,121,249,0.16)', surfaceGlass: 'rgba(232,121,249,0.12)', borderGlass: '#e879f9', bgGradient: 'radial-gradient(circle at 50% -20%, #2e1065 0%, #020617 100%)', glowColor: 'rgba(232,121,249,0.5)' },
    glassPattern: 'grid', glassGlowIntensity: 0.45, glassInnerGlow: false, glassHoverEffect: 'glow'
  },
  theme_cyberpunk: {
    id: 'theme_cyberpunk', name: i18n.t('themes.theme_cyberpunk'), rarity: 'legendary', blurLevel: '8px', effect: 'cyber-grid', borderRadius: '16px', borderWidth: '3px', glassOpacity: '0.15',
    colors: { accent: '#d946ef', accentContrast: '#ffffff', surface1: 'rgba(217,70,239,0.08)', surface2: 'rgba(217,70,239,0.12)', surface3: 'rgba(217,70,239,0.16)', surfaceGlass: 'rgba(217,70,239,0.15)', borderGlass: '#d946ef', bgGradient: 'radial-gradient(circle at 50% 0%, #4a044e 0%, #020617 100%)', glowColor: 'rgba(217,70,239,0.6)' },
    glassPattern: 'grid', glassGlowIntensity: 0.6, glassInnerGlow: false, glassHoverEffect: 'glow'
  },
  theme_lime: {
    id: 'theme_lime', name: i18n.t('themes.theme_lime'), blurLevel: '26px', effect: 'floating-particles', borderRadius: '16px', borderWidth: '1px', glassOpacity: '0.04',
    colors: { accent: '#65a30d', accentContrast: '#ffffff', surface1: 'rgba(101,163,13,0.05)', surface2: 'rgba(101,163,13,0.08)', surface3: 'rgba(101,163,13,0.12)', surfaceGlass: 'rgba(101,163,13,0.06)', borderGlass: 'rgba(101,163,13,0.2)', bgGradient: 'radial-gradient(circle at 50% 0%, #052e16 0%, #020617 100%)', glowColor: 'rgba(101,163,13,0.2)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.3, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(101,163,13,0.15), transparent)', glassHoverEffect: 'brightness'
  },
  theme_forest: {
    id: 'theme_forest', name: i18n.t('themes.theme_forest'), blurLevel: '22px', effect: 'floating-particles', borderRadius: '16px', borderWidth: '1.5px', glassOpacity: '0.05',
    colors: { accent: '#0d9488', accentContrast: '#ffffff', surface1: 'rgba(13,148,136,0.05)', surface2: 'rgba(13,148,136,0.08)', surface3: 'rgba(13,148,136,0.12)', surfaceGlass: 'rgba(13,148,136,0.06)', borderGlass: 'rgba(13,148,136,0.2)', bgGradient: 'linear-gradient(180deg, #14532d 0%, #020617 100%)', glowColor: 'rgba(13,148,136,0.2)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.2, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(13,148,136,0.1), transparent)', glassHoverEffect: 'brightness'
  },
  theme_midnight: {
    id: 'theme_midnight', name: i18n.t('themes.theme_midnight'), blurLevel: '30px', effect: 'space-stars', borderRadius: '16px', borderWidth: '1.5px', glassOpacity: '0.04',
    colors: { accent: '#818cf8', accentContrast: '#ffffff', surface1: 'rgba(129,140,248,0.05)', surface2: 'rgba(129,140,248,0.08)', surface3: 'rgba(129,140,248,0.12)', surfaceGlass: 'rgba(129,140,248,0.06)', borderGlass: 'rgba(129,140,248,0.3)', bgGradient: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0f0a2a 40%, #020617 100%)', glowColor: 'rgba(129,140,248,0.3)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.3, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(129,140,248,0.15), transparent)', glassHoverEffect: 'glow'
  },
  theme_ocean: {
    id: 'theme_ocean', name: i18n.t('themes.theme_ocean'), blurLevel: '20px', effect: 'water-ripples', borderRadius: '16px', borderWidth: '1px', glassOpacity: '0.06',
    colors: { accent: '#3b82f6', accentContrast: '#ffffff', surface1: 'rgba(59,130,246,0.05)', surface2: 'rgba(59,130,246,0.08)', surface3: 'rgba(59,130,246,0.12)', surfaceGlass: 'rgba(59,130,246,0.06)', borderGlass: 'rgba(59,130,246,0.25)', bgGradient: 'radial-gradient(circle at 50% 10%, #172554 0%, #020617 100%)', glowColor: 'rgba(59,130,246,0.25)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.25, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(59,130,246,0.15), transparent)', glassHoverEffect: 'brightness'
  },
  theme_red: {
    id: 'theme_red', name: i18n.t('themes.theme_red'), blurLevel: '24px', effect: 'golden-rays', borderRadius: '16px', borderWidth: '3px', glassOpacity: '0.08',
    colors: { accent: '#ef4444', accentContrast: '#ffffff', surface1: 'rgba(239,68,68,0.06)', surface2: 'rgba(239,68,68,0.1)', surface3: 'rgba(239,68,68,0.14)', surfaceGlass: 'rgba(239,68,68,0.08)', borderGlass: '#ef4444', bgGradient: 'radial-gradient(circle at 50% -20%, #7f1d1d 0%, #450a0a 40%, #020617 100%)', glowColor: 'rgba(239,68,68,0.5)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.45, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(239,68,68,0.2), rgba(249,115,22,0.1), transparent)', glassHoverEffect: 'glow'
  },
  theme_royal: {
    id: 'theme_royal', name: i18n.t('themes.theme_royal'), rarity: 'legendary', blurLevel: '26px', effect: 'golden-rays', borderRadius: '16px', borderWidth: '4px', glassOpacity: '0.12',
    colors: { accent: '#f59e0b', accentContrast: '#451a03', surface1: 'rgba(245,158,11,0.08)', surface2: 'rgba(245,158,11,0.12)', surface3: 'rgba(245,158,11,0.16)', surfaceGlass: 'rgba(245,158,11,0.12)', borderGlass: '#f59e0b', bgGradient: 'radial-gradient(circle at 50% 0%, #78350f 0%, #020617 100%)', glowColor: 'rgba(245,158,11,0.5)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.5, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(245,158,11,0.25), transparent)', glassHoverEffect: 'glow'
  },
  theme_sakura: {
    id: 'theme_sakura', name: i18n.t('themes.theme_sakura'), blurLevel: '22px', effect: 'floating-particles', borderRadius: '16px', borderWidth: '1.5px', glassOpacity: '0.04',
    colors: { accent: '#fbcfe8', accentContrast: '#500724', surface1: 'rgba(251,207,232,0.05)', surface2: 'rgba(251,207,232,0.08)', surface3: 'rgba(251,207,232,0.12)', surfaceGlass: 'rgba(251,207,232,0.06)', borderGlass: 'rgba(251,207,232,0.2)', bgGradient: 'radial-gradient(circle at 50% 0%, #500724 0%, #020617 100%)', glowColor: 'rgba(251,207,232,0.2)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.3, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(251,207,232,0.15), transparent)', glassHoverEffect: 'brightness'
  },
  theme_sunset: {
    id: 'theme_sunset', name: i18n.t('themes.theme_sunset'), blurLevel: '20px', effect: 'fire-embers', borderRadius: '16px', borderWidth: '1.5px', glassOpacity: '0.08',
    colors: { accent: '#f97316', accentContrast: '#ffffff', surface1: 'rgba(249,115,22,0.06)', surface2: 'rgba(249,115,22,0.1)', surface3: 'rgba(249,115,22,0.14)', surfaceGlass: 'rgba(249,115,22,0.08)', borderGlass: 'rgba(249,115,22,0.3)', bgGradient: 'radial-gradient(circle at 50% 0%, #7c2d12 0%, #020617 100%)', glowColor: 'rgba(249,115,22,0.25)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.35, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(249,115,22,0.15), transparent)', glassHoverEffect: 'brightness'
  },
  theme_yellow: {
    id: 'theme_yellow', name: i18n.t('themes.theme_yellow'), blurLevel: '20px', effect: 'floating-particles', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.06',
    colors: { accent: '#fbbf24', accentContrast: '#422006', surface1: 'rgba(251,191,36,0.06)', surface2: 'rgba(251,191,36,0.1)', surface3: 'rgba(251,191,36,0.14)', surfaceGlass: 'rgba(251,191,36,0.08)', borderGlass: '#fbbf24', bgGradient: 'radial-gradient(circle at 50% -20%, #78350f 0%, #451a03 40%, #020617 100%)', glowColor: 'rgba(251,191,36,0.35)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.3, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(251,191,36,0.2), rgba(245,158,11,0.1), transparent)', glassHoverEffect: 'glow'
  },
  theme_crystal: {
    id: 'theme_crystal', name: i18n.t('themes.theme_crystal'), rarity: 'legendary', blurLevel: '22px', effect: 'water-ripples', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.06',
    colors: { accent: '#67e8f9', accentContrast: '#0c4a6e', surface1: 'rgba(103,232,249,0.06)', surface2: 'rgba(103,232,249,0.1)', surface3: 'rgba(103,232,249,0.14)', surfaceGlass: 'rgba(103,232,249,0.08)', borderGlass: '#67e8f9', bgGradient: 'radial-gradient(circle at 50% -10%, #155e75 0%, #083344 40%, #020617 100%)', glowColor: 'rgba(103,232,249,0.4)' },
    glassPattern: 'gradient', glassGlowIntensity: 0.35, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(103,232,249,0.15), rgba(6,182,212,0.1), transparent)', glassHoverEffect: 'glow'
  },

  // ═══════ PREMIUM THEMES (Plus/Pro only) ═══════
  // Premium themes use exclusive effects (pearl-shimmer, silk-sweep, canvas-texture, depth-breathe)
  // and can layer a second effect via overlayEffect

  premium_galaxy: {
    id: 'premium_galaxy', name: i18n.t('themes.premium_galaxy'), rarity: 'legendary', blurLevel: '28px', effect: 'pearl-shimmer', overlayEffect: 'space-stars', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.06',
    colors: { accent: '#6d28d9', accentContrast: '#ffffff', surface1: 'rgba(109,40,217,0.07)', surface2: 'rgba(109,40,217,0.11)', surface3: 'rgba(109,40,217,0.15)', surfaceGlass: 'rgba(109,40,217,0.08)', borderGlass: '#6d28d9', bgGradient: 'radial-gradient(circle at 50% -20%, #3b0764 0%, #1e0033 40%, #020617 100%)', glowColor: 'rgba(109,40,217,0.5)' },
    glassPattern: 'satin', glassGlowIntensity: 0.5, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(109,40,217,0.2), rgba(124,58,237,0.1), transparent)', glassHoverEffect: 'glow'
  },
  premium_storm: {
    id: 'premium_storm', name: i18n.t('themes.premium_storm'), rarity: 'legendary', blurLevel: '12px', effect: 'silk-sweep', overlayEffect: 'cyber-grid', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.12',
    colors: { accent: '#0284c7', accentContrast: '#ffffff', surface1: 'rgba(2,132,199,0.08)', surface2: 'rgba(2,132,199,0.12)', surface3: 'rgba(2,132,199,0.16)', surfaceGlass: 'rgba(2,132,199,0.1)', borderGlass: '#0284c7', bgGradient: 'radial-gradient(circle at 50% -10%, #0c4a6e 0%, #020617 100%)', glowColor: 'rgba(2,132,199,0.6)' },
    glassPattern: 'grid', glassGlowIntensity: 0.6, glassInnerGlow: false, glassHoverEffect: 'glow'
  },
  premium_ember: {
    id: 'premium_ember', name: i18n.t('themes.premium_ember'), rarity: 'legendary', blurLevel: '18px', effect: 'depth-breathe', overlayEffect: 'fire-embers', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.08',
    colors: { accent: '#e11d48', accentContrast: '#ffffff', surface1: 'rgba(225,29,72,0.06)', surface2: 'rgba(225,29,72,0.1)', surface3: 'rgba(225,29,72,0.14)', surfaceGlass: 'rgba(225,29,72,0.08)', borderGlass: '#e11d48', bgGradient: 'radial-gradient(circle at 50% -10%, #4c0519 0%, #2d000e 40%, #020617 100%)', glowColor: 'rgba(225,29,72,0.55)' },
    glassPattern: 'satin', glassGlowIntensity: 0.55, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(225,29,72,0.2), rgba(244,63,94,0.1), transparent)', glassHoverEffect: 'glow'
  },
  premium_aurora_green: {
    id: 'premium_aurora_green', name: i18n.t('themes.premium_aurora_green'), rarity: 'legendary', blurLevel: '26px', effect: 'silk-sweep', overlayEffect: 'aurora-waves', borderRadius: '16px', borderWidth: '1.5px', glassOpacity: '0.05',
    colors: { accent: '#10b981', accentContrast: '#ffffff', surface1: 'rgba(16,185,129,0.06)', surface2: 'rgba(16,185,129,0.09)', surface3: 'rgba(16,185,129,0.13)', surfaceGlass: 'rgba(16,185,129,0.07)', borderGlass: '#10b981', bgGradient: 'radial-gradient(circle at 50% 0%, #064e3b 0%, #022c22 40%, #020617 100%)', glowColor: 'rgba(16,185,129,0.45)' },
    glassPattern: 'satin', glassGlowIntensity: 0.55, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(16,185,129,0.2), rgba(5,150,105,0.1), transparent)', glassHoverEffect: 'brightness'
  },
  premium_nebula: {
    id: 'premium_nebula', name: i18n.t('themes.premium_nebula'), rarity: 'legendary', blurLevel: '24px', effect: 'pearl-shimmer', overlayEffect: 'floating-particles', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.06',
    colors: { accent: '#a21caf', accentContrast: '#ffffff', surface1: 'rgba(162,28,175,0.06)', surface2: 'rgba(162,28,175,0.1)', surface3: 'rgba(162,28,175,0.14)', surfaceGlass: 'rgba(162,28,175,0.08)', borderGlass: '#a21caf', bgGradient: 'radial-gradient(circle at 50% -20%, #4a044e 0%, #2d0030 40%, #020617 100%)', glowColor: 'rgba(162,28,175,0.5)' },
    glassPattern: 'lens', glassGlowIntensity: 0.5, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(162,28,175,0.2), rgba(168,85,247,0.1), transparent)', glassHoverEffect: 'glow'
  },
  premium_frost: {
    id: 'premium_frost', name: i18n.t('themes.premium_frost'), rarity: 'legendary', blurLevel: '16px', effect: 'canvas-texture', overlayEffect: 'cyber-grid', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.1',
    colors: { accent: '#0891b2', accentContrast: '#ffffff', surface1: 'rgba(8,145,178,0.08)', surface2: 'rgba(8,145,178,0.12)', surface3: 'rgba(8,145,178,0.16)', surfaceGlass: 'rgba(8,145,178,0.1)', borderGlass: '#0891b2', bgGradient: 'radial-gradient(circle at 50% -20%, #164e63 0%, #020617 100%)', glowColor: 'rgba(8,145,178,0.6)' },
    glassPattern: 'lens', glassGlowIntensity: 0.6, glassInnerGlow: false, glassHoverEffect: 'glow'
  },

  // ── Pro tier (overlay also uses premium effects) ──
  premium_dragon: {
    id: 'premium_dragon', name: i18n.t('themes.premium_dragon'), rarity: 'legendary', blurLevel: '20px', effect: 'depth-breathe', overlayEffect: 'golden-rays', borderRadius: '16px', borderWidth: '3px', glassOpacity: '0.1',
    colors: { accent: '#b91c1c', accentContrast: '#ffffff', surface1: 'rgba(185,28,28,0.07)', surface2: 'rgba(185,28,28,0.11)', surface3: 'rgba(185,28,28,0.15)', surfaceGlass: 'rgba(185,28,28,0.1)', borderGlass: '#b91c1c', bgGradient: 'radial-gradient(circle at 50% 0%, #450a0a 0%, #1f0000 40%, #020617 100%)', glowColor: 'rgba(185,28,28,0.6)' },
    glassPattern: 'satin', glassGlowIntensity: 0.6, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(185,28,28,0.25), rgba(234,179,8,0.08), transparent)', glassHoverEffect: 'glow'
  },
  premium_heaven: {
    id: 'premium_heaven', name: i18n.t('themes.premium_heaven'), rarity: 'legendary', blurLevel: '28px', effect: 'pearl-shimmer', overlayEffect: 'golden-rays', borderRadius: '16px', borderWidth: '2px', glassOpacity: '0.04',
    colors: { accent: '#fde047', accentContrast: '#422006', surface1: 'rgba(253,224,71,0.06)', surface2: 'rgba(253,224,71,0.09)', surface3: 'rgba(253,224,71,0.13)', surfaceGlass: 'rgba(253,224,71,0.07)', borderGlass: '#fde047', bgGradient: 'radial-gradient(circle at 50% -10%, #713f12 0%, #422006 40%, #020617 100%)', glowColor: 'rgba(253,224,71,0.5)' },
    glassPattern: 'lens', glassGlowIntensity: 0.55, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(253,224,71,0.2), rgba(234,179,8,0.1), transparent)', glassHoverEffect: 'brightness'
  },
  premium_void: {
    id: 'premium_void', name: i18n.t('themes.premium_void'), rarity: 'legendary', blurLevel: '40px', effect: 'canvas-texture', overlayEffect: 'space-stars', borderRadius: '16px', borderWidth: '1px', glassOpacity: '0.02',
    colors: { accent: '#4338ca', accentContrast: '#ffffff', surface1: 'rgba(67,56,202,0.05)', surface2: 'rgba(67,56,202,0.08)', surface3: 'rgba(67,56,202,0.12)', surfaceGlass: 'rgba(67,56,202,0.04)', borderGlass: 'rgba(67,56,202,0.4)', bgGradient: 'radial-gradient(circle at 50% 0%, #0f0a2a 0%, #050510 40%, #000000 100%)', glowColor: 'rgba(67,56,202,0.35)' },
    glassPattern: 'satin', glassGlowIntensity: 0.5, glassInnerGlow: true, glassHoverEffect: 'glow'
  },
  premium_divine: {
    id: 'premium_divine', name: i18n.t('themes.premium_divine'), rarity: 'legendary', blurLevel: '24px', effect: 'silk-sweep', overlayEffect: 'floating-particles', borderRadius: '16px', borderWidth: '1.5px', glassOpacity: '0.04',
    colors: { accent: '#c084fc', accentContrast: '#3b0764', surface1: 'rgba(192,132,252,0.06)', surface2: 'rgba(192,132,252,0.09)', surface3: 'rgba(192,132,252,0.13)', surfaceGlass: 'rgba(192,132,252,0.06)', borderGlass: '#c084fc', bgGradient: 'radial-gradient(circle at 50% -20%, #3b0764 0%, #1a0033 40%, #020617 100%)', glowColor: 'rgba(192,132,252,0.45)' },
    glassPattern: 'lens', glassGlowIntensity: 0.6, glassInnerGlow: true, glassGradient: 'linear-gradient(to bottom right, rgba(192,132,252,0.2), rgba(168,85,247,0.1), transparent)', glassHoverEffect: 'brightness'
  },
};

export function getThemeConfig(themeId: string | null | undefined): ThemeConfig {
  if (!themeId) return APP_THEMES.theme_default;
  if (APP_THEMES[themeId]) return APP_THEMES[themeId];
  return APP_THEMES.theme_default;
}

// Export APP_THEMES as fallback for offline/loading states
export { APP_THEMES as FALLBACK_THEMES };
