import { Droplets, Flame, Swords, Trophy, Sparkles, Zap, Lightbulb, BarChart3 } from 'lucide-react';
import type { SocialFeedPost } from '../../models';

interface PostCardContentProps {
  post: SocialFeedPost;
  postContent: string;
  isAchievement: boolean;
  isCompare: boolean;
  isChallenge: boolean;
  isMilestone: boolean;
  isWaterLog: boolean;
  handleJoinChallenge: () => void;
}

export const PostCardContent = ({
  post,
  postContent,
  isAchievement,
  isCompare,
  isChallenge,
  isMilestone,
  isWaterLog,
  handleJoinChallenge,
}: PostCardContentProps) => {
  if (isAchievement) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-amber-500/30 bg-amber-500/5 rounded-2xl text-center relative overflow-hidden">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-4 border-4 border-slate-900 z-10">
          <Trophy size={36} className="text-white" />
        </div>
        <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1 z-10 flex items-center gap-1"><Sparkles size={12} /> Kỷ Lục Mới</p>
        <h4 className="text-white text-2xl font-black mb-2 z-10">{post.content}</h4>
        {post.value && <p className="text-slate-300 text-sm z-10">Hoàn thành xuất sắc mục tiêu đề ra.</p>}
      </div>
    );
  }

  if (isCompare) {
    return (
      <div className="border border-white/10 bg-slate-950/40 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
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
      <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-4">
        <h4 className="text-purple-300 font-bold mb-1">Mục tiêu chung:</h4>
        <p className="text-white text-lg font-black leading-relaxed">{postContent}</p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleJoinChallenge}
            className="flex-1 bg-white text-purple-900 font-black py-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            Nhận lời
          </button>
        </div>
      </div>
    );
  }

  if (isMilestone) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
          <Flame size={32} className="text-white" />
        </div>
        <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-1">Peak mới</p>
        <h4 className="text-white text-2xl font-black mb-2">Chuỗi {post.value || post.streak_snapshot || 0} ngày</h4>
        {postContent && <p className="text-slate-300 text-sm">{postContent}</p>}
      </div>
    );
  }

  if (isWaterLog) {
    const amount = post.value || post.hydration_ml || 0;
    const goal = post.author?.water_goal || 0;
    const progress = goal > 0 ? Math.min(100, Math.round((Number(amount) / goal) * 100)) : 0;

    return (
      <div className="space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
            <Droplets size={24} className="text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="text-xl font-black text-white">{amount} ml</h4>
              {goal > 0 && <span className="text-xs font-bold text-cyan-300">{progress}%</span>}
            </div>
            {goal > 0 && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${progress}%` }} />
              </div>
            )}
            <p className="mt-2 truncate text-sm text-slate-400">{postContent || 'Vừa thả Pulse hôm nay.'}</p>
          </div>
        </div>
        {post.image_url && (
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950">
            <img src={post.image_url} alt="Proof Pulse" loading="lazy" className="w-full max-h-[420px] object-cover" />
          </div>
        )}
      </div>
    );
  }

  if (post.type === 'tip') {
    const categoryLabel = post.tip_category === 'science' ? 'Khoa học' : post.tip_category === 'recipe' ? 'Công thức nước' : 'Mẹo vặt';
    const categoryColor = post.tip_category === 'science' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : post.tip_category === 'recipe' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
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
        {postContent && <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">{postContent}</p>}
        {post.image_url && (
          <div className="rounded-2xl overflow-hidden bg-slate-950 mt-3 border border-white/5">
            <img src={post.image_url} alt="" loading="lazy" className="w-full max-h-[400px] object-cover" />
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
            <p className="text-white font-bold text-lg mt-0.5">{postContent}</p>
          </div>
        </div>
        <div className="space-y-2">
          {options.map((opt) => {
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

  return (
    <>
      {postContent && <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap mb-3">{postContent}</p>}
      {post.image_url && (
        <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/5">
          <img src={post.image_url} alt="Ảnh bài viết" loading="lazy" className="w-full max-h-[500px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
    </>
  );
};
