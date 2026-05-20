import { Lock } from 'lucide-react';

export const ArenaPaywall = () => (
  <div className="relative h-[60vh] rounded-[2.5rem] overflow-hidden border border-white/5 mx-4 flex items-center justify-center mt-6">
    <div className="absolute inset-0 p-6 space-y-4 blur-[8px] opacity-30 pointer-events-none select-none flex flex-col">
      {[1, 2, 3, 4].map((index) => (<div key={index} className="h-28 bg-slate-800 rounded-3xl border border-slate-700" />))}
    </div>
    <div className="relative z-10 flex flex-col items-center text-center p-10 bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl mx-6 w-full max-w-[340px]">
      <div className="relative w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20 group">
        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
        <Lock size={40} className="text-indigo-400 relative z-10" />
      </div>
      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Khu vực hạn chế</h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">Đấu trường DigiBottle yêu cầu phụ kiện kết nối vật lý và xác thực phần cứng Pro-Link.</p>
      <div className="w-full py-4 rounded-2xl font-black text-[10px] text-indigo-300 bg-indigo-500/5 border border-indigo-500/20 uppercase tracking-[0.2em]">
        CHƯA PHÁT HÀNH CÔNG KHAI
      </div>
    </div>
  </div>
);
