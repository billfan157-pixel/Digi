import { Smartphone, Trophy, Users, BrainCircuit, Droplets, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SEALandingScreenProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export default function SEALandingScreen({ onBack, onGetStarted }: SEALandingScreenProps) {
  const { t } = useTranslation();

  const features = [
    { icon: Droplets, key: 'log' },
    { icon: Trophy, key: 'challenge' },
    { icon: Users, key: 'social' },
    { icon: BrainCircuit, key: 'ai' },
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative overflow-hidden font-sans bg-slate-950">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      <div className="absolute bottom-20 -right-20 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

      <div className="flex-1 overflow-y-auto px-6 pt-14 pb-6 z-10 custom-scrollbar">
        <button onClick={onBack} className="text-xs text-slate-500 font-bold uppercase tracking-wider hover:text-white transition-colors mb-8">
          ← {t('sea.back')}
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">{t('sea.title')}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{t('sea.subtitle')}</p>
        </div>

        <div className="space-y-3 mb-8">
          {features.map((f) => (
            <div key={f.key} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <f.icon size={18} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t(`sea.feature_${f.key}_title`)}</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{t(`sea.feature_${f.key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/5 to-amber-600/5 border border-amber-500/20 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-amber-400">{t('sea.pro_title')}</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{t('sea.pro_desc')}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onGetStarted}
            className="w-full py-4 rounded-3xl font-semibold text-sm tracking-wide text-slate-950 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] active:scale-95 transition-all duration-200 ease-out flex items-center justify-center gap-2"
          >
            <span>{t('sea.get_started')}</span>
            <ArrowRight size={16} />
          </button>
          <p className="text-center text-[10px] text-slate-600">{t('sea.available')}</p>
        </div>
      </div>
    </div>
  );
}
