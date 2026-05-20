import { Users, Shield, Flame, ChevronRight, Crown, ShieldCheck, Loader2, Lock as LockIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Club {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  member_count: number;
  total_wp: number;
  created_at: string;
  min_level_required: number;
  club_level: number;
}

interface ClubCardProps {
  club: Club;
  userId: string;
  myRole: string | undefined;
  userStats: { level: number };
  joiningId: string | null;
  onJoin: (clubId: string) => void;
  onSelect: (club: Club) => void;
}

export function ClubCard({
  club,
  userId,
  myRole,
  userStats,
  joiningId,
  onJoin,
  onSelect,
}: ClubCardProps) {
  const isMember = !!myRole; 
  const isOwner = myRole === 'owner' || club.owner_id === userId; 
  const canJoin = userStats.level >= (club.min_level_required || 1);
  const isJoining = joiningId === club.id;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => (isMember || isOwner) && onSelect(club)}
      className={`relative overflow-hidden bg-slate-900/40 border rounded-3xl p-5 transition-all group ${
        (isMember || isOwner) ? "cursor-pointer border-white/10 hover:border-cyan-500/30" : "border-white/5"
      }`}
    >
      {(isMember || isOwner) && (
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/5 blur-3xl rounded-full" />
      )}

      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-bold text-lg">{club.name}</h4>
            {club.total_wp > 50000 && <Flame size={14} className="text-orange-500" fill="currentColor" />}
          </div>
          <p className="text-slate-400 text-sm line-clamp-1 pr-10">
            {club.description || "Thành viên tích cực, nạp nước mỗi ngày"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400">
            <Users size={18} />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">{club.member_count} mems</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20">
            <Shield size={14} /> Cập {club.club_level || 1}
          </div>
          {(club.min_level_required || 1) > 1 && (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
              <ShieldCheck size={14} /> Y/C: Lv.{club.min_level_required}+
            </div>
          )}
        </div>

        {isOwner ? (
          <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/20">
            <Crown size={14} /> Bang của sếp
          </div>
        ) : isMember ? (
          <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold hover:text-cyan-300 transition-colors">
            Vào bang <ChevronRight size={14} />
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canJoin) {
                onJoin(club.id);
              }
            }}
            disabled={isJoining || !canJoin}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-[100px] ${
              canJoin
                ? 'bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isJoining ? <Loader2 size={14} className="animate-spin" /> : canJoin ? "Gia nhập" : <LockIcon size={12} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}
