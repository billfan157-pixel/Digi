/**
 * GroupChallengesModal Component
 * Multiplayer hydration challenges
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trophy, Users, Calendar, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { LazyImage } from '@/components/LazyImage';

interface GroupChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GroupChallenge {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  stake_coins: number;
  max_participants: number;
  start_date: string;
  end_date: string;
  status: string;
  participant_count?: number;
}

interface LeaderboardEntry {
  rank_position: number;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  total_ml: number;
}

export const GroupChallengesModal = ({ isOpen, onClose }: GroupChallengesModalProps) => {
  const { t } = useTranslation();
  const [selectedChallenge, setSelectedChallenge] = useState<GroupChallenge | null>(null);
  const queryClient = useQueryClient();
  const profile = useAppStore((s) => s.profile);

  // Fetch active challenges
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['group-challenges'],
    queryFn: async (): Promise<GroupChallenge[]> => {
      const { data, error } = await supabase
        .from('group_challenges')
        .select('*, participant_count:group_challenge_participants(count)')
        .in('status', ['active', 'pending'])
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Fetch leaderboard for selected challenge
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['group-challenge-leaderboard', selectedChallenge?.id],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!selectedChallenge) return [];
      const { data, error } = await supabase.rpc('get_group_challenge_leaderboard', {
        p_challenge_id: selectedChallenge.id,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!selectedChallenge,
  });

  // Join challenge mutation
  const joinChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase.rpc('join_group_challenge', { p_challenge_id: challengeId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-challenges'] });
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-amber-400" />
              <h2 className="text-white font-bold">Thử thách nhóm</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[70vh]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : challenges.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Users size={48} className="text-slate-600" />
                <p className="text-slate-500 text-sm">No group challenges yet</p>
                <p className="text-slate-600 text-xs">Create a new challenge to compete with friends</p>
              </div>
            ) : (
              <div className="space-y-3">
                {challenges.map((challenge) => (
                  <button
                    key={challenge.id}
                    onClick={() => setSelectedChallenge(challenge)}
                    className={`w-full p-4 rounded-2xl border transition-all text-left ${
                      selectedChallenge?.id === challenge.id
                        ? 'bg-cyan-500/20 border-cyan-500/50'
                        : 'bg-slate-800/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{challenge.name}</h3>
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{challenge.description}</p>
                      </div>
                      {challenge.stake_coins > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20">
                          <Coins size={12} className="text-amber-400" />
                          <span className="text-amber-400 text-xs font-bold">{challenge.stake_coins}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-slate-500 text-xs">
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        <span>{challenge.participant_count || 0}/{challenge.max_participants}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard Panel */}
          {selectedChallenge && (
            <div className="p-4 border-t border-white/5 bg-slate-950/50">
              <h3 className="text-white font-semibold mb-3">Bảng xếp hạng</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {leaderboard.map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-400 text-slate-900' :
                      index === 1 ? 'bg-slate-400 text-slate-900' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {entry.rank_position}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                      {entry.avatar_url ? (
                        <LazyImage src={entry.avatar_url} alt={entry.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                          {entry.nickname?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{entry.nickname}</p>
                    </div>
                    <span className="text-cyan-400 text-sm font-bold">{(entry.total_ml / 1000).toFixed(1)}L</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => joinChallenge.mutate(selectedChallenge.id)}
                disabled={joinChallenge.isPending}
                className="w-full mt-4 py-3 rounded-xl bg-cyan-500 text-white font-bold disabled:opacity-50"
              >
                {joinChallenge.isPending ? 'Joining...' : 'Join Challenge'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
