import React from 'react';
import { Cpu, Settings2, Activity, CloudSun, Calendar, ShieldCheck } from 'lucide-react';
import ScheduleManager from '../../components/ScheduleManager';

interface SystemSectionProps {
  profile: any;
  isPremium: boolean;
  isWatchConnected: boolean;
  isWeatherSynced: boolean;
  isCalendarSynced: boolean;
}

export default function SystemSection({
  profile,
  isPremium,
  isWatchConnected,
  isWeatherSynced,
  isCalendarSynced,
}: SystemSectionProps) {
  return (
    <div className="space-y-6 mt-2">
      <div className="px-6">
        <ScheduleManager profile={profile} alwaysExpanded={true} />
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu size={16} className="text-indigo-400" /> DigiWell Intelligence
          </h3>
          {!isPremium && <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-[0_0_10px_#f59e0b]">Upgrade</span>}
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <h4 className="text-white font-bold text-sm">Trạng thái đồng bộ</h4>
            <p className="text-slate-400 text-xs mt-0.5">HealthKit, Thiết bị, Lịch trình</p>
          </div>
          <div className="flex -space-x-2">
            {isWatchConnected && <div className="w-8 h-8 rounded-full bg-rose-500/20 border-2 border-slate-950 flex items-center justify-center"><Activity size={12} className="text-rose-400"/></div>}
            {isWeatherSynced && <div className="w-8 h-8 rounded-full bg-sky-500/20 border-2 border-slate-950 flex items-center justify-center"><CloudSun size={12} className="text-sky-400"/></div>}
            {isCalendarSynced && <div className="w-8 h-8 rounded-full bg-purple-500/20 border-2 border-slate-950 flex items-center justify-center"><Calendar size={12} className="text-purple-400"/></div>}
            {(!isWatchConnected && !isWeatherSynced && !isCalendarSynced) && <span className="text-xs font-bold text-slate-500">Chưa có</span>}
          </div>
        </div>
      </div>
    </div>
  );
}