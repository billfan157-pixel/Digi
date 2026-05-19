import { useState, type FormEvent } from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { registerSchema, formatZodErrors } from '@/lib/validations';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

const card = "bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl";

export default function RegisterScreen({ onBack, onSuccess }: RegisterScreenProps) {
  const { t } = useTranslation();
  const [regData, setRegData] = useState({
    nickname: '', password: '', gender: 'Nam', age: 25,
    height: 172, weight: 68, activity: 'sedentary',
    climate: 'tropical', goal: 'Sức khỏe tổng quát',
    wakeUp: '06:00', bedTime: '23:00'
  });
  
  const [regEmail, setRegEmail] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingReg) return;

    const parsed = registerSchema.safeParse({ email: regEmail, ...regData });
    if (!parsed.success) {
      toast.error(formatZodErrors(parsed.error));
      return;
    }
    const { email, password, ...profileData } = parsed.data;
    
    setIsSubmittingReg(true);
    const toastId = toast.loading(t('auth.setting_up'));
    
    try {
      const { data: authData, error: authError } = await supabase!.auth.signUp({ 
        email: email.toLowerCase().trim(), 
        password,
      });
      
      if (authError) throw authError;

      if (authData.user) {
        const initialWaterGoal = profileData.weight * 35;

        const { error: dbError } = await supabase!.from('profiles').upsert([{
          id: authData.user.id,
          nickname: profileData.nickname,
          gender: profileData.gender,
          age: profileData.age,
          height: profileData.height,
          weight: profileData.weight,
          activity: profileData.activity,
          climate: profileData.climate,
          goal: profileData.goal,
          wake_up: profileData.wakeUp,
          bed_time: profileData.bedTime,
          water_goal: initialWaterGoal,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
        if (dbError) throw new Error(t('auth.error_save_profile') + dbError.message);
      }
      
      toast.success(t('auth.success'), { id: toastId });
      
      if (!authData.session) { 
        onSuccess(email); 
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || t('auth.error'), { id: toastId });
    } finally { setIsSubmittingReg(false); }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto font-sans overflow-y-auto bg-slate-950">
      <Toaster position="top-center" theme="dark" richColors />
      <div className="p-6 pt-14">
        <button onClick={onBack} className="mb-8 p-2 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/5 text-slate-400 inline-flex active:scale-95 transition-all duration-200 ease-out hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-3xl font-black text-white mb-8">{t('auth.register_title')}</h2>

        <form onSubmit={handleRegister} className="space-y-5 pb-16">
          <div className={`${card} p-5 space-y-3`}>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest pb-2 border-b border-slate-700">{t('auth.account_section')}</p>
            <input type="email" placeholder={t('auth.email')} aria-label={t('auth.email')} value={regEmail} onChange={e => setRegEmail(e.target.value)} disabled={isSubmittingReg} className="w-full p-3.5 rounded-2xl bg-slate-800/50 border border-white/5 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out text-sm disabled:opacity-50" />
            <input type="text" placeholder={t('auth.nickname')} aria-label={t('auth.nickname')} value={regData.nickname} onChange={e => setRegData({ ...regData, nickname: e.target.value })} disabled={isSubmittingReg} className="w-full p-3.5 rounded-2xl bg-slate-800/50 border border-white/5 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out text-sm disabled:opacity-50" />
            <input type="password" placeholder={t('auth.password_min')} aria-label={t('auth.password')} value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} disabled={isSubmittingReg} className="w-full p-3.5 rounded-2xl bg-slate-800/50 border border-white/5 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out text-sm disabled:opacity-50" />
          </div>

          <div className={`${card} p-5 space-y-3`}>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest pb-2 border-b border-slate-700">{t('auth.body_section')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">{t('auth.gender')}</label><select aria-label={t('auth.gender')} value={regData.gender} onChange={e => setRegData({ ...regData, gender: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50"><option>{t('auth.male')}</option><option>{t('auth.female')}</option><option>{t('auth.other')}</option></select></div>
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">{t('auth.age')}</label><input type="number" aria-label={t('auth.age')} value={regData.age} onChange={e => setRegData({ ...regData, age: +e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50" /></div>
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">{t('auth.height')}</label><input type="number" aria-label={t('auth.height')} value={regData.height} onChange={e => setRegData({ ...regData, height: +e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50" /></div>
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">{t('auth.weight')}</label><input type="number" aria-label={t('auth.weight')} value={regData.weight} onChange={e => setRegData({ ...regData, weight: +e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50" /></div>
            </div>
          </div>

          <div className={`${card} p-5 space-y-3`}>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest pb-2 border-b border-slate-700">{t('auth.lifestyle')}</p>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">{t('auth.activity_level')}</label>
              <select aria-label={t('auth.activity_level')} value={regData.activity} onChange={e => setRegData({ ...regData, activity: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50">
                <option value="sedentary">{t('auth.activity_sedentary')}</option>
                <option value="light">{t('auth.activity_light')}</option>
                <option value="moderate">{t('auth.activity_moderate')}</option>
                <option value="high">{t('auth.activity_high')}</option>
                <option value="athlete">{t('auth.activity_athlete')}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">{t('auth.climate')}</label>
              <select aria-label={t('auth.climate')} value={regData.climate} onChange={e => setRegData({ ...regData, climate: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50">
                <option value="temperate">{t('auth.climate_temperate')}</option>
                <option value="warm">{t('auth.climate_warm')}</option>
                <option value="hot">{t('auth.climate_hot')}</option>
                <option value="tropical">{t('auth.climate_tropical')}</option>
                <option value="cold">{t('auth.climate_cold')}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">{t('auth.health_goal')}</label>
              <select aria-label={t('auth.health_goal')} value={regData.goal} onChange={e => setRegData({ ...regData, goal: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50">
                <option value="Giảm mỡ & Tăng cơ">{t('auth.goal_fat_muscle')}</option><option value="Sức khỏe tổng quát">{t('auth.goal_health')}</option><option value="Bảo vệ da">{t('auth.goal_skin')}</option>
              </select>
            </div>
          </div>

          <div className={`${card} p-5 space-y-3`}>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest pb-2 border-b border-slate-700">{t('auth.circadian_section')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">{t('auth.wake_up')}</label><input type="time" aria-label={t('auth.wake_up')} value={regData.wakeUp} onChange={e => setRegData({ ...regData, wakeUp: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50" /></div>
              <div><label className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 block">{t('auth.bed_time')}</label><input type="time" aria-label={t('auth.bed_time')} value={regData.bedTime} onChange={e => setRegData({ ...regData, bedTime: e.target.value })} disabled={isSubmittingReg} className="w-full p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50" /></div>
            </div>
          </div>

          <button type="submit" disabled={isSubmittingReg} className="w-full py-4 rounded-3xl font-semibold text-slate-950 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all duration-200 ease-out shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]" style={{ background: isSubmittingReg ? '#334155' : '#06b6d4' }}>
            {isSubmittingReg ? <span className="animate-pulse">{t('auth.processing')}</span> : <><span>{t('auth.confirm_start')}</span><ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
