import { memo } from 'react';
import { Droplets, Flame, Swords, Trophy, Sparkles, Zap, Lightbulb, BarChart3 } from 'lucide-react';
import type { SocialFeedPost } from '../../models';
import { sanitizeHtml } from '@/lib/sanitize';

interface PostCardContentProps {
  post: SocialFeedPost;
  postContent: string;
  isAchievement: boolean;
  isCompare: boolean;
  isChallenge: boolean;
  isMilestone: boolean;
  isWaterLog: boolean;
  isDrop: boolean;
  handleJoinChallenge: () => void;
}

export const PostCardContent = memo(({
  post,
  postContent,
  isAchievement,
  isCompare,
  isChallenge,
  isMilestone,
  isWaterLog,
  isDrop,
  handleJoinChallenge,
}: PostCardContentProps) => {
  const safeContent = sanitizeHtml(postContent);
  if (isAchievement) {
    return (
      <div className="group flex flex-col items-center justify-center p-8 border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-slate-950 rounded-[2rem] text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-amber-500/10 pointer-events-none" />
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-[0_20px_50px_rgba(245,158,11,0.3)] mb-6 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 border-2 border-white/20 z-10">
          <Trophy size={40} className="text-white drop-shadow-lg" />
        </div>
        <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 z-10 flex items-center gap-2">
           <Sparkles size={12} className="animate-pulse" /> Kỷ Lục Mới
        </p>
         <h4 className="text-white text-3xl font-black mb-3 z-10 tracking-tight leading-none truncate max-w-full">{post.content}</h4>
        <div className="h-[1px] w-12 bg-amber-500/30 mx-auto mb-3" />
        <p className="text-slate-400 text-xs font-medium z-10 max-w-[200px] leading-relaxed">Một cột mốc đáng tự hào trong hành trình DigiWell của bạn.</p>
      </div>
    );
  }

  if (isCompare) {
    return (
      <div className="border border-white/10 bg-slate-950/40 rounded-[2rem] p-6 relative overflow-hidden flex flex-col items-center">
        <div className="flex items-center justify-center mb-5 relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-[2px] shadow-[0_0_20px_rgba(6,182,212,0.3)] z-10 transform translate-x-3">
            <img src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.nickname}&background=0D8ABC&color=fff`} className="w-full h-full rounded-full border-2 border-slate-900 object-cover" />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center z-20 shadow-xl">
            <Zap size={14} className="text-amber-400" />
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-[2px] shadow-[0_0_20px_rgba(16,185,129,0.3)] z-10 transform -translate-x-3">
            <img src={post.compare_avatar || `https://ui-avatars.com/api/?name=${post.compare_name}&background=10B981&color=fff`} className="w-full h-full rounded-full border-2 border-slate-900 object-cover" />
          </div>
        </div>
        <p className="text-center text-white font-bold text-lg leading-snug mb-2 z-10">
          Cả bạn và <span className="text-emerald-400">{post.compare_name || 'Đồng đội'}</span> đều đạt <span className="text-amber-400">{post.value || 100}%</span> mục tiêu!
        </p>
        <p className="text-center text-slate-400 text-xs z-10">Cùng nhau giữ vững phong độ nhé.</p>
        <button className="mt-4 px-6 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 active:scale-95 transition-all">
          Gửi lời chúc mừng
        </button>
      </div>
    );
  }

  if (isChallenge) {
    return (
      <div className="bg-purple-900/20 border border-purple-500/20 rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-4">
           <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Swords size={20} className="text-purple-400" />
           </div>
           <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest">Thử thách chung</p>
        </div>
        <p className="text-white text-xl font-black leading-tight mb-6 break-words">{safeContent}</p>
        <button
          onClick={handleJoinChallenge}
          className="w-full bg-white text-purple-950 font-black py-3.5 rounded-2xl hover:bg-slate-100 active:scale-[0.98] transition-all shadow-xl shadow-purple-500/10"
        >
          Nhận lời thách đấu
        </button>
      </div>
    );
  }

  if (isMilestone) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-orange-500/10 to-slate-900/40 border border-orange-500/20 rounded-[2rem] text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
          <Flame size={40} className="text-white" />
        </div>
        <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Peak Mới</p>
        <h4 className="text-white text-3xl font-black mb-2 tracking-tight truncate max-w-full">Chuỗi {post.value || post.streak_snapshot || 0} ngày</h4>
         {safeContent && <p className="text-slate-400 text-sm font-medium break-words">{safeContent}</p>}
      </div>
    );
  }

  if (isWaterLog) {
    const amount = post.value || post.hydration_ml || 0;
    const goal = post.author?.water_goal || 0;
    const progress = goal > 0 ? Math.min(100, Math.round((Number(amount) / goal) * 100)) : 0;

    return (
      <div className="group relative space-y-4">
        {post.image_url ? (
          <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950 aspect-[4/5]">
            <img src={post.image_url} alt="Proof Pulse" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            
            {/* Glossy Overlay for Content */}
            <div className="absolute inset-x-4 bottom-4 p-5 rounded-[1.5rem] bg-slate-950/40 backdrop-blur-xl border border-white/10 shadow-2xl">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <Droplets size={20} className="text-cyan-400" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Lượng nạp</p>
                        <h4 className="text-xl font-black text-white">{amount} <span className="text-xs font-bold text-slate-400">ML</span></h4>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Tiến độ</p>
                     <h4 className="text-xl font-black text-white">{progress}%</h4>
                  </div>
               </div>

               {/* Progress Bar */}
               <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" 
                    style={{ width: `${progress}%` }} 
                  />
               </div>

               {safeContent && (
                 <p className="mt-3 text-xs text-slate-200 font-medium line-clamp-2 italic">
                   "{safeContent}"
                 </p>
               )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 rounded-[2rem] border border-cyan-500/10 bg-slate-900/40 p-6">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <Droplets size={28} className="text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between mb-1">
                  <h4 className="text-2xl font-black text-white">{amount} ml</h4>
                  <span className="text-xs font-bold text-cyan-400">{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-400 font-medium">{safeContent || 'Đã nạp thêm nước cho cơ thể.'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (post.type === 'tip') {
    const tipCategory = post.tip_category || '';
    const categoryLabel = tipCategory === 'science' ? 'Khoa học' : tipCategory === 'recipe' ? 'Công thức nước' : 'Mẹo vặt';
    const categoryColor = tipCategory === 'science' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : tipCategory === 'recipe' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    return (
      <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Lightbulb size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Mẹo hydration</p>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-lg text-[9px] font-bold ${categoryColor}`}>{categoryLabel}</span>
          </div>
        </div>
        {safeContent && <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap break-words">{safeContent}</p>}
        {post.image_url && (
          <div className="rounded-2xl overflow-hidden bg-slate-950 mt-3 border border-white/5">
            <img src={post.image_url} alt={post.content || 'Ảnh bài viết'} loading="lazy" className="w-full max-h-[400px] object-cover" />
          </div>
        )}
      </div>
    );
  }

  if (post.type === 'poll') {
    const options = post.poll_options || [];
    const totalVotes = options.reduce((sum, o) => sum + (o.count || 0), 0);
    const hasVoted = !!post.voted_option_id;
    return (
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <BarChart3 size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Khảo sát</p>
            <p className="text-white font-bold text-lg mt-0.5">{safeContent}</p>
          </div>
        </div>
        <div className="space-y-2">
          {options.map((opt: { id: string; text: string; count: number }) => {
            const pct = totalVotes > 0 ? Math.round((opt.count / totalVotes) * 100) : 0;
            const isSelected = hasVoted && post.voted_option_id === opt.id;
            return (
              <button
                key={opt.id}
                disabled={hasVoted}
                onClick={() => {
                  // Vote logic handled via parent/supabase in future
                }}
                className={`w-full relative overflow-hidden rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? 'border-amber-500/40 bg-amber-500/15'
                    : hasVoted
                      ? 'border-white/5 bg-slate-800/30 cursor-default'
                      : 'border-white/10 bg-slate-800/40 hover:border-amber-500/30 active:scale-[0.99]'
                }`}
              >
                {hasVoted && (
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-500/10 rounded-xl transition-all"
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative z-10 flex justify-between items-center">
                  <span className="text-sm font-bold text-white">{opt.text}</span>
                  {hasVoted && <span className="text-xs font-bold text-amber-400">{pct}%</span>}
                </div>
              </button>
            );
          })}
        </div>
{hasVoted && (
           <p className="text-center text-[10px] text-slate-500 mt-3">{totalVotes} phiếu bầu</p>
         )}
       </div>
     );
   }

   // Drop/Story posts special styling
   if (isDrop) {
     return (
       <div className="space-y-3">
         <div className="flex items-center gap-2 mb-1">
           <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
             Drop
           </span>
         </div>
         {safeContent && <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap break-words">{safeContent}</p>}
         {post.image_url && (
           <div className="rounded-2xl overflow-hidden bg-slate-950 border border-white/5">
             <img src={post.image_url} alt="Drop" loading="lazy" className="w-full max-h-[300px] object-cover"
               onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
           </div>
         )}
       </div>
     );
   }

   return (
     <>
       {safeContent && <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap break-words mb-3">{safeContent}</p>}
       {post.image_url && (
         <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/5">
           <img src={post.image_url} alt="Ảnh bài viết" loading="lazy" className="w-full max-h-[500px] object-cover"
             onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
         </div>
       )}
     </>
   );
});
