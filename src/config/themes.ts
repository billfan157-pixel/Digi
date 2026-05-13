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

export type ThemeEffect = 'none' | 'cyber-grid' | 'aurora-waves' | 'space-stars' | 'floating-particles' | 'fire-embers' | 'water-ripples' | 'golden-rays';

export interface ThemeConfig {
  id: string;
  name: string;
  colors: ThemeColors;
  blurLevel: string;
  effect: ThemeEffect;
  borderRadius: string;
  borderWidth: string;
  glassOpacity: string;
}

export const APP_THEMES: Record<string, ThemeConfig> = {
  theme_default: {
    id: 'theme_default', name: 'Mặc định', blurLevel: '20px', effect: 'none', borderRadius: '16px', borderWidth: '1px', glassOpacity: '0.04',
    colors: { accent: '#22d3ee', accentContrast: '#06121a', surface1: 'rgba(34,211,238,0.03)', surface2: 'rgba(34,211,238,0.05)', surface3: 'rgba(34,211,238,0.08)', surfaceGlass: 'rgba(34,211,238,0.04)', borderGlass: 'rgba(34,211,238,0.1)', bgGradient: 'radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 100%)', glowColor: 'rgba(34,211,238,0.15)' }
  },
  th_cyan: {
    id: 'th_cyan', name: 'Hồ Thủy Tiên', blurLevel: '16px', effect: 'water-ripples', borderRadius: '40px', borderWidth: '1.5px', glassOpacity: '0.06',
    colors: { accent: '#0ea5e9', accentContrast: '#ffffff', surface1: 'rgba(14,165,233,0.05)', surface2: 'rgba(14,165,233,0.08)', surface3: 'rgba(14,165,233,0.12)', surfaceGlass: 'rgba(14,165,233,0.06)', borderGlass: 'rgba(14,165,233,0.2)', bgGradient: 'radial-gradient(circle at 50% 0%, #0c4a6e 0%, #020617 100%)', glowColor: 'rgba(14,165,233,0.15)' }
  },
  th_emerald: {
    id: 'th_emerald', name: 'Lục Bảo', blurLevel: '24px', effect: 'floating-particles', borderRadius: '32px', borderWidth: '1px', glassOpacity: '0.05',
    colors: { accent: '#10b981', accentContrast: '#ffffff', surface1: 'rgba(16,185,129,0.05)', surface2: 'rgba(16,185,129,0.08)', surface3: 'rgba(16,185,129,0.12)', surfaceGlass: 'rgba(16,185,129,0.06)', borderGlass: 'rgba(16,185,129,0.2)', bgGradient: 'linear-gradient(180deg, #064e3b 0%, #020617 100%)', glowColor: 'rgba(16,185,129,0.25)' }
  },
  th_gold: {
    id: 'th_gold', name: 'Hoàng Kim', blurLevel: '24px', effect: 'golden-rays', borderRadius: '12px', borderWidth: '3px', glassOpacity: '0.1',
    colors: { accent: '#eab308', accentContrast: '#422006', surface1: 'rgba(234,179,8,0.08)', surface2: 'rgba(234,179,8,0.12)', surface3: 'rgba(234,179,8,0.16)', surfaceGlass: 'rgba(234,179,8,0.1)', borderGlass: '#eab308', bgGradient: 'conic-gradient(from 180deg at 50% 0%, #422006, #713f12, #020617, #713f12, #422006)', glowColor: 'rgba(234,179,8,0.4)' }
  },
  th_purple: {
    id: 'th_purple', name: 'Màn Đêm', blurLevel: '30px', effect: 'space-stars', borderRadius: '14px', borderWidth: '1px', glassOpacity: '0.04',
    colors: { accent: '#a855f7', accentContrast: '#ffffff', surface1: 'rgba(168,85,247,0.05)', surface2: 'rgba(168,85,247,0.08)', surface3: 'rgba(168,85,247,0.12)', surfaceGlass: 'rgba(168,85,247,0.06)', borderGlass: 'rgba(168,85,247,0.15)', bgGradient: 'linear-gradient(180deg, #3b0764 0%, #020617 100%)', glowColor: 'rgba(168,85,247,0.2)' }
  },
  th_rose: {
    id: 'th_rose', name: 'Hoa Hồng Máu', blurLevel: '20px', effect: 'fire-embers', borderRadius: '8px', borderWidth: '2px', glassOpacity: '0.06',
    colors: { accent: '#f43f5e', accentContrast: '#ffffff', surface1: 'rgba(244,63,94,0.05)', surface2: 'rgba(244,63,94,0.08)', surface3: 'rgba(244,63,94,0.12)', surfaceGlass: 'rgba(244,63,94,0.06)', borderGlass: '#f43f5e', bgGradient: 'radial-gradient(circle at 50% -10%, #4c0519 0%, #020617 100%)', glowColor: 'rgba(244,63,94,0.3)' }
  },
  theme_abyss: {
    id: 'theme_abyss', name: 'Vực Thẳm Không Gian', blurLevel: '40px', effect: 'space-stars', borderRadius: '24px', borderWidth: '0px', glassOpacity: '0.8',
    colors: { accent: '#6366f1', accentContrast: '#ffffff', surface1: 'rgba(99,102,241,0.06)', surface2: 'rgba(99,102,241,0.1)', surface3: 'rgba(99,102,241,0.14)', surfaceGlass: 'rgba(0,0,0,0.85)', borderGlass: 'rgba(99,102,241,0.4)', bgGradient: 'black', glowColor: 'rgba(99,102,241,0.6)' }
  },
  theme_aurora: {
    id: 'theme_aurora', name: 'Cực Quang', blurLevel: '22px', effect: 'aurora-waves', borderRadius: '30px', borderWidth: '1px', glassOpacity: '0.05',
    colors: { accent: '#a78bfa', accentContrast: '#ffffff', surface1: 'rgba(167,139,250,0.06)', surface2: 'rgba(167,139,250,0.09)', surface3: 'rgba(167,139,250,0.12)', surfaceGlass: 'rgba(167,139,250,0.08)', borderGlass: 'rgba(255,255,255,0.25)', bgGradient: 'conic-gradient(from 180deg at 50% 0%, #1e1b4b, #2e1065, #020617, #083344, #1e1b4b)', glowColor: 'rgba(167,139,250,0.3)' }
  },
  theme_cyan: {
    id: 'theme_cyan', name: 'Xanh Cyan', blurLevel: '12px', effect: 'cyber-grid', borderRadius: '4px', borderWidth: '2px', glassOpacity: '0.1',
    colors: { accent: '#06b6d4', accentContrast: '#ffffff', surface1: 'rgba(6,182,212,0.08)', surface2: 'rgba(6,182,212,0.12)', surface3: 'rgba(6,182,212,0.16)', surfaceGlass: 'rgba(6,182,212,0.1)', borderGlass: '#06b6d4', bgGradient: 'radial-gradient(circle at 50% -20%, #083344 0%, #020617 100%)', glowColor: 'rgba(6,182,212,0.4)' }
  },
  theme_cyber: {
    id: 'theme_cyber', name: 'Cyber Neon', blurLevel: '10px', effect: 'cyber-grid', borderRadius: '2px', borderWidth: '2px', glassOpacity: '0.12',
    colors: { accent: '#f0abfc', accentContrast: '#000000', surface1: 'rgba(240,171,252,0.08)', surface2: 'rgba(240,171,252,0.12)', surface3: 'rgba(240,171,252,0.16)', surfaceGlass: 'rgba(240,171,252,0.12)', borderGlass: '#f0abfc', bgGradient: 'radial-gradient(circle at 50% -20%, #2e1065 0%, #020617 100%)', glowColor: 'rgba(240,171,252,0.5)' }
  },
  theme_cyberpunk: {
    id: 'theme_cyberpunk', name: 'Cyberpunk 2077', blurLevel: '8px', effect: 'cyber-grid', borderRadius: '0px', borderWidth: '3px', glassOpacity: '0.15',
    colors: { accent: '#d946ef', accentContrast: '#ffffff', surface1: 'rgba(217,70,239,0.08)', surface2: 'rgba(217,70,239,0.12)', surface3: 'rgba(217,70,239,0.16)', surfaceGlass: 'rgba(217,70,239,0.15)', borderGlass: '#d946ef', bgGradient: 'radial-gradient(circle at 50% 0%, #4a044e 0%, #020617 100%)', glowColor: 'rgba(217,70,239,0.6)' }
  },
  theme_emerald: {
    id: 'theme_emerald', name: 'Rừng Nhiệt Đới', blurLevel: '26px', effect: 'floating-particles', borderRadius: '48px', borderWidth: '1px', glassOpacity: '0.04',
    colors: { accent: '#22c55e', accentContrast: '#ffffff', surface1: 'rgba(34,197,94,0.05)', surface2: 'rgba(34,197,94,0.08)', surface3: 'rgba(34,197,94,0.12)', surfaceGlass: 'rgba(34,197,94,0.06)', borderGlass: 'rgba(34,197,94,0.2)', bgGradient: 'radial-gradient(circle at 50% 0%, #052e16 0%, #020617 100%)', glowColor: 'rgba(34,197,94,0.2)' }
  },
  theme_forest: {
    id: 'theme_forest', name: 'Rừng Nguyên Sinh', blurLevel: '22px', effect: 'floating-particles', borderRadius: '36px', borderWidth: '1.5px', glassOpacity: '0.05',
    colors: { accent: '#059669', accentContrast: '#ffffff', surface1: 'rgba(5,150,105,0.05)', surface2: 'rgba(5,150,105,0.08)', surface3: 'rgba(5,150,105,0.12)', surfaceGlass: 'rgba(5,150,105,0.06)', borderGlass: 'rgba(5,150,105,0.2)', bgGradient: 'linear-gradient(180deg, #14532d 0%, #020617 100%)', glowColor: 'rgba(5,150,105,0.2)' }
  },
  theme_midnight: {
    id: 'theme_midnight', name: 'Sự tĩnh lặng', blurLevel: '28px', effect: 'space-stars', borderRadius: '12px', borderWidth: '1px', glassOpacity: '0.03',
    colors: { accent: '#818cf8', accentContrast: '#ffffff', surface1: 'rgba(129,140,248,0.04)', surface2: 'rgba(129,140,248,0.07)', surface3: 'rgba(129,140,248,0.1)', surfaceGlass: 'rgba(129,140,248,0.05)', borderGlass: 'rgba(129,140,248,0.15)', bgGradient: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 100%)', glowColor: 'rgba(129,140,248,0.15)' }
  },
  theme_ocean: {
    id: 'theme_ocean', name: 'Đại Dương Xanh', blurLevel: '20px', effect: 'water-ripples', borderRadius: '24px', borderWidth: '1px', glassOpacity: '0.06',
    colors: { accent: '#3b82f6', accentContrast: '#ffffff', surface1: 'rgba(59,130,246,0.05)', surface2: 'rgba(59,130,246,0.08)', surface3: 'rgba(59,130,246,0.12)', surfaceGlass: 'rgba(59,130,246,0.06)', borderGlass: 'rgba(59,130,246,0.25)', bgGradient: 'radial-gradient(circle at 50% 10%, #172554 0%, #020617 100%)', glowColor: 'rgba(59,130,246,0.25)' }
  },
  theme_red: {
    id: 'theme_red', name: 'Đỏ Thẫm', blurLevel: '16px', effect: 'fire-embers', borderRadius: '6px', borderWidth: '2px', glassOpacity: '0.1',
    colors: { accent: '#dc2626', accentContrast: '#ffffff', surface1: 'rgba(220,38,38,0.05)', surface2: 'rgba(220,38,38,0.08)', surface3: 'rgba(220,38,38,0.12)', surfaceGlass: 'rgba(220,38,38,0.06)', borderGlass: '#dc2626', bgGradient: 'linear-gradient(180deg, #450a0a 0%, #020617 100%)', glowColor: 'rgba(220,38,38,0.3)' }
  },
  theme_royal: {
    id: 'theme_royal', name: 'Đế Vương Hoàng Gia', blurLevel: '26px', effect: 'golden-rays', borderRadius: '16px', borderWidth: '4px', glassOpacity: '0.12',
    colors: { accent: '#fbbf24', accentContrast: '#451a03', surface1: 'rgba(251,191,36,0.08)', surface2: 'rgba(251,191,36,0.12)', surface3: 'rgba(251,191,36,0.16)', surfaceGlass: 'rgba(251,191,36,0.12)', borderGlass: '#fbbf24', bgGradient: 'radial-gradient(circle at 50% 0%, #78350f 0%, #020617 100%)', glowColor: 'rgba(251,191,36,0.5)' }
  },
  theme_sakura: {
    id: 'theme_sakura', name: 'Hoa Anh Đào', blurLevel: '22px', effect: 'floating-particles', borderRadius: '40px', borderWidth: '1.5px', glassOpacity: '0.04',
    colors: { accent: '#fbcfe8', accentContrast: '#500724', surface1: 'rgba(251,207,232,0.05)', surface2: 'rgba(251,207,232,0.08)', surface3: 'rgba(251,207,232,0.12)', surfaceGlass: 'rgba(251,207,232,0.06)', borderGlass: 'rgba(251,207,232,0.2)', bgGradient: 'radial-gradient(circle at 50% 0%, #500724 0%, #020617 100%)', glowColor: 'rgba(251,207,232,0.2)' }
  },
  theme_sunset: {
    id: 'theme_sunset', name: 'Hoàng Hôn', blurLevel: '20px', effect: 'fire-embers', borderRadius: '20px', borderWidth: '1.5px', glassOpacity: '0.08',
    colors: { accent: '#f97316', accentContrast: '#ffffff', surface1: 'rgba(249,115,22,0.06)', surface2: 'rgba(249,115,22,0.1)', surface3: 'rgba(249,115,22,0.14)', surfaceGlass: 'rgba(249,115,22,0.08)', borderGlass: 'rgba(249,115,22,0.3)', bgGradient: 'radial-gradient(circle at 50% 0%, #7c2d12 0%, #020617 100%)', glowColor: 'rgba(249,115,22,0.25)' }
  },
  theme_yellow: {
    id: 'theme_yellow', name: 'Vàng Chanh', blurLevel: '24px', effect: 'golden-rays', borderRadius: '28px', borderWidth: '1px', glassOpacity: '0.05',
    colors: { accent: '#fde047', accentContrast: '#422006', surface1: 'rgba(253,224,71,0.05)', surface2: 'rgba(253,224,71,0.08)', surface3: 'rgba(253,224,71,0.12)', surfaceGlass: 'rgba(253,224,71,0.06)', borderGlass: 'rgba(253,224,71,0.2)', bgGradient: 'radial-gradient(circle at 50% -10%, #422006 0%, #020617 100%)', glowColor: 'rgba(253,224,71,0.2)' }
  },
};

export function getThemeConfig(themeId: string | null | undefined): ThemeConfig {
  if (!themeId) return APP_THEMES.theme_default;
  if (APP_THEMES[themeId]) return APP_THEMES[themeId];
  return APP_THEMES.theme_default;
}
