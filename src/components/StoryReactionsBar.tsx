/**
 * StoryReactionsBar Component
 * Emoji reaction bar for hydration stories
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface StoryReactionsBarProps {
  storyId: string;
  initialReactions?: Record<string, number>;
  initialUserReactions?: string[];
  onReactionChange?: (newCounts: Record<string, number>, total: number) => void;
}

const EMOJI_OPTIONS = ['❤️', '😂', '😮', '😢', '🔥'] as const;
type EmojiType = typeof EMOJI_OPTIONS[number];

interface ReactionResult {
  counts: Record<string, number>;
  user_reactions: string[];
}

export const StoryReactionsBar = ({
  storyId,
  initialReactions,
  initialUserReactions = [],
  onReactionChange,
}: StoryReactionsBarProps) => {
  const { t } = useTranslation();
  const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch current reactions
  const { data: reactionsData } = useQuery({
    queryKey: ['story-reactions', storyId],
    queryFn: async (): Promise<ReactionResult | null> => {
      const { data, error } = await supabase.rpc('get_story_reactions', { p_story_id: storyId });
      if (error) {
        console.error('Failed to fetch reactions:', error);
        return null;
      }
      return data;
    },
    initialData: {
      counts: initialReactions || { '❤️': 0, '😂': 0, '😮': 0, '😢': 0, '🔥': 0 },
      user_reactions: initialUserReactions,
    },
  });

  const counts = reactionsData?.counts || initialReactions || {};
  const userReactions = reactionsData?.user_reactions || initialUserReactions || [];

  // Toggle reaction mutation
  const toggleReaction = useMutation({
    mutationFn: async (emoji: EmojiType) => {
      const { data, error } = await supabase.rpc('toggle_story_reaction', {
        p_story_id: storyId,
        p_emoji: emoji,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (result) => {
      if (result) {
        // Invalidate to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ['story-reactions', storyId] });

        // Also update the social posts cache
        queryClient.invalidateQueries({ queryKey: ['social-posts'] });

        if (onReactionChange && result.counts) {
          const total = Object.values(result.counts).reduce((a, b) => a + b, 0);
          onReactionChange(result.counts, total);
        }
      }
    },
    onError: (error) => {
      console.error('Failed to toggle reaction:', error);
      toast.error(t('common.cant_add_reaction'));
    },
  });

  const handleEmojiClick = useCallback((emoji: EmojiType) => {
    setAnimatingEmoji(emoji);
    setTimeout(() => setAnimatingEmoji(null), 300);
    toggleReaction.mutate(emoji);
  }, [toggleReaction]);

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-t border-white/5">
      <div className="flex items-center gap-1">
        {EMOJI_OPTIONS.map((emoji) => {
          const count = counts[emoji] || 0;
          const isSelected = userReactions.includes(emoji);
          const isAnimating = animatingEmoji === emoji;

          return (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className={`
                relative flex items-center gap-1 px-2 py-1.5 rounded-full
                transition-all duration-200 active:scale-90
                ${isSelected
                  ? 'bg-white/10 ring-1 ring-white/20'
                  : 'hover:bg-white/5'
                }
                ${isAnimating ? 'animate-bounce' : ''}
              `}
            >
              <span className="text-lg">{emoji}</span>
              {count > 0 && (
                <span className={`
                  text-xs font-bold tabular-nums
                  ${isSelected ? 'text-white' : 'text-slate-400'}
                `}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {totalReactions > 0 && (
        <span className="text-xs text-slate-500 font-medium">
          {totalReactions} phản ứng
        </span>
      )}
    </div>
  );
};
