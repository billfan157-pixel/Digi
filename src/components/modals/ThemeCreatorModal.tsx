import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Sparkles, Save, RotateCcw, Eye, Check } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';
import { AppStorage } from '@/lib/storage';
import type { ThemeConfig, ThemeEffect, GlassPattern, GlassHoverEffect } from '@/config/themes';
import { getThemeConfigSync } from '@/services/theme.service';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#06b6d4', '#0ea5e9', '#6366f1', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
  '#84cc16', '#22c55e', '#14b8a6', '#64748b', '#f8fafc',
];

const EFFECTS: ThemeEffect[] = ['none', 'cyber-grid', 'aurora-waves', 'space-stars', 'floating-particles', 'fire-embers', 'water-ripples', 'golden-rays', 'pearl-shimmer', 'silk-sweep', 'canvas-texture', 'depth-breathe'];
const effectLabels: Record<ThemeEffect, string> = {
  'none': 'None', 'cyber-grid': 'Cyber Grid', 'aurora-waves': 'Aurora', 'space-stars': 'Space',
  'floating-particles': 'Floating Particles', 'fire-embers': 'Fire Embers', 'water-ripples': 'Water Ripples', 'golden-rays': 'Golden Rays',
  'pearl-shimmer': 'Pearl Shimmer', 'silk-sweep': 'Silk Sweep', 'canvas-texture': 'Canvas', 'depth-breathe': 'Deep Breath',
};
const PATTERNS: GlassPattern[] = ['none', 'gradient', 'grid', 'scanline', 'diagonal', 'satin', 'lens'];
const HOVER_EFFECTS: GlassHoverEffect[] = ['brightness', 'opacity', 'scale', 'glow'];
import { useTranslation } from 'react-i18next';

const ThemeCreatorModal: React.FC = () => {
  const { t } = useTranslation();
  const isOpen = useUIStore(s => s.showThemeCreator);
  const onClose = () => {
    useUIStore.getState().setShowThemeCreator(false);
    useAppStore.getState().setAppState({ themePreview: null });
  };

  const [accent, setAccent] = useState('#06b6d4');
  const [blurLevel, setBlurLevel] = useState('20px');
  const [borderRadius, setBorderRadius] = useState('16px');
  const [borderWidth, setBorderWidth] = useState('1px');
  const [glassOpacity, setGlassOpacity] = useState('0.15');
  const [effect, setEffect] = useState<ThemeEffect>('none');
  const [glassPattern, setGlassPattern] = useState<GlassPattern>('none');
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  const [glassHoverEffect, setGlassHoverEffect] = useState<GlassHoverEffect>('brightness');
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const saved = AppStorage.getItem('custom_theme');
    if (saved) {
      try {
        const cfg = JSON.parse(saved) as ThemeConfig;
        setAccent(cfg.colors.accent);
        setBlurLevel(cfg.blurLevel);
        setBorderRadius('16px');
        setBorderWidth(cfg.borderWidth);
        setGlassOpacity(cfg.glassOpacity);
        setEffect(cfg.effect);
        setGlassPattern(cfg.glassPattern);
        setGlowIntensity(cfg.glassGlowIntensity);
        setGlassHoverEffect(cfg.glassHoverEffect);
      } catch { /* ignore */ }
    } else {
      const profile = useAppStore.getState().profile;
      const current = getThemeConfigSync(profile?.equipped_theme_id);
      setAccent(current.colors.accent);
      setBlurLevel(current.blurLevel);
      setBorderRadius('16px');
      setBorderWidth(current.borderWidth);
      setGlassOpacity(current.glassOpacity);
      setEffect(current.effect);
      setGlassPattern(current.glassPattern);
      setGlowIntensity(current.glassGlowIntensity);
      setGlassHoverEffect(current.glassHoverEffect);
    }
    setIsApplied(false);
  }, [isOpen]);

  const buildConfig = useCallback((): ThemeConfig => ({
    id: 'custom_theme',
    name: t('theme_creator.default_theme_name'),
    colors: {
      accent,
      accentContrast: '#ffffff',
      surface1: `rgba(15, 23, 42, ${0.8 - Number(glassOpacity) * 0.3})`,
      surface2: `rgba(30, 41, 59, ${0.6 - Number(glassOpacity) * 0.2})`,
      surface3: `rgba(51, 65, 85, ${0.4 - Number(glassOpacity) * 0.1})`,
      surfaceGlass: `rgba(255, 255, 255, ${glassOpacity})`,
      borderGlass: `rgba(255, 255, 255, ${Math.min(Number(glassOpacity) * 2, 0.3).toFixed(2)})`,
      bgGradient: 'linear-gradient(180deg, #0f172a, #020617)',
      glowColor: accent,
    },
    blurLevel,
    effect,
    borderRadius,
    borderWidth,
    glassOpacity,
    glassPattern,
    glassGlowIntensity: glowIntensity,
    glassInnerGlow: false,
    glassHoverEffect,
  }), [accent, blurLevel, borderRadius, borderWidth, glassOpacity, effect, glassPattern, glowIntensity, glassHoverEffect, t]);

  const handleApply = () => {
    useAppStore.getState().setAppState({ themePreview: buildConfig() });
    setIsApplied(true);
  };

  const handleSave = () => {
    const cfg = buildConfig();
    AppStorage.setItem('custom_theme', JSON.stringify(cfg));
    handleApply();
    toast.success(t('theme_creator.theme_saved'));
  };

  const handleReset = () => {
    const profile = useAppStore.getState().profile;
    const current = getThemeConfigSync(profile?.equipped_theme_id);
    setAccent(current.colors.accent);
    setBlurLevel(current.blurLevel);
    setBorderRadius('16px');
    setBorderWidth(current.borderWidth);
    setGlassOpacity(current.glassOpacity);
    setEffect(current.effect);
    setGlassPattern(current.glassPattern);
    setGlowIntensity(current.glassGlowIntensity);
    setGlassHoverEffect(current.glassHoverEffect);
    useAppStore.getState().setAppState({ themePreview: null });
    setIsApplied(false);
    toast.success(t('theme_creator.theme_reset'));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="theme-creator" className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl scrollbar-hide"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${accent}30, transparent 70%)` }} />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${accent}15, transparent 70%)` }} />

            <div className="flex justify-between items-center mb-5 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent }}>
                  <Sparkles size={16} className="text-white" />
                </div>
                <h2 className="text-white font-black text-sm uppercase tracking-wider">{t('settings.create_theme')}</h2>
              </div>
              <button onClick={onClose} className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 relative z-10">
              {/* Color */}
              <div>
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2 block">{t('theme_creator.section_accent')}</label>
                <div className="flex items-center gap-2 mb-2">
                  <input type="color" value={accent} onChange={(e) => { setAccent(e.target.value); setIsApplied(false); }}
                    className="w-10 h-10 rounded-xl border border-white/10 cursor-pointer bg-transparent" />
                  <input type="text" value={accent} onChange={(e) => { setAccent(e.target.value); setIsApplied(false); }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-white/20" />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => { setAccent(c); setIsApplied(false); }}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${accent === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>

              {/* Effect */}
              <div>
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2 block">{t('theme_creator.section_bg_effect')}</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {EFFECTS.map(ef => (
                    <button key={ef} onClick={() => { setEffect(ef); setIsApplied(false); }}
                      className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                        effect === ef ? 'text-white border-white/20' : 'text-slate-500 border-white/5 bg-white/5'
                      }`}
                      style={effect === ef ? { background: `${accent}20`, borderColor: `${accent}40` } : {}}>
                      {effectLabels[ef]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pattern */}
              <div>
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2 block">{t('theme_creator.section_glass_pattern')}</label>
                <div className="flex gap-1.5">
                  {PATTERNS.map(p => (
                    <button key={p} onClick={() => { setGlassPattern(p); setIsApplied(false); }}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                        glassPattern === p ? 'text-white border-white/20' : 'text-slate-500 border-white/5 bg-white/5'
                      }`}
                      style={glassPattern === p ? { background: `${accent}20`, borderColor: `${accent}40` } : {}}>
                      {t('theme_creator.pattern_' + p)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hover */}
              <div>
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2 block">{t('theme_creator.section_hover_effect')}</label>
                <div className="flex gap-1.5">
                  {HOVER_EFFECTS.map(h => (
                    <button key={h} onClick={() => { setGlassHoverEffect(h); setIsApplied(false); }}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                        glassHoverEffect === h ? 'text-white border-white/20' : 'text-slate-500 border-white/5 bg-white/5'
                      }`}
                      style={glassHoverEffect === h ? { background: `${accent}20`, borderColor: `${accent}40` } : {}}>
                      {t('theme_creator.effect_' + h)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              {[
                { label: 'Blur', value: blurLevel, set: setBlurLevel, min: '4', max: '40', unit: 'px' },
                { label: t('theme_creator.slider_border'), value: borderWidth, set: setBorderWidth, min: '0', max: '4', unit: 'px' },
                { label: t('theme_creator.slider_glass_opacity'), value: glassOpacity, set: setGlassOpacity, min: '0.04', max: '0.4', unit: '' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{s.label}</label>
                    <span className="text-[11px] font-bold text-white">{s.value}{s.unit !== undefined ? s.unit : 'px'}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step="1" value={s.value}
                    onChange={(e) => { s.set(e.target.value); setIsApplied(false); }}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: accent }} />
                </div>
              ))}

              {/* Glow slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t('theme_creator.glow_intensity')}</label>
                  <span className="text-[11px] font-bold text-white">{glowIntensity.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={glowIntensity}
                  onChange={(e) => { setGlowIntensity(Number(e.target.value)); setIsApplied(false); }}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: accent }} />
              </div>

              {/* Preview */}
              <div className="rounded-2xl p-4 text-center"
                style={{
                  background: `rgba(255, 255, 255, ${glassOpacity})`,
                  backdropFilter: `blur(${blurLevel})`,
                  border: `${borderWidth} solid rgba(255, 255, 255, ${Math.min(Number(glassOpacity) * 2, 0.3).toFixed(2)})`,
                  borderRadius,
                  boxShadow: `0 0 ${10 * glowIntensity}px ${accent}${Math.round(30 * glowIntensity).toString(16).padStart(2, '0')}`,
                }}>
                <Palette size={20} className="mx-auto mb-1" style={{ color: accent }} />
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: accent }}>{t('theme_creator.preview_title')}</p>
                <p className="text-[7px] text-slate-400 mt-0.5">{t('theme_creator.preview_desc')}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all hover:bg-white/5">
                  <RotateCcw size={12} /> {t('common.reset')}
                </button>
                <button onClick={handleApply}
                  className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)`, boxShadow: `0 0 12px ${accent}30` }}>
                  {isApplied ? <><Check size={12} /> {t('theme_creator.applied')}</> : <><Eye size={12} /> {t('common.apply')}</>}
                </button>
                <button onClick={handleSave}
                  className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 0 12px ${accent}40` }}>
                  <Save size={12} /> {t('common.save')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ThemeCreatorModal;
