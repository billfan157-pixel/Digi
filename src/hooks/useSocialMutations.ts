import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appQueryKeys } from '@/lib/queryKeys';
import { addFollow, removeFollow, addLike, removeLike } from '@/lib/social.service';
import type { SocialFeedPost } from '@/models';

export function useFollowMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: appQueryKeys.socialCloseCircle(userId) });
    queryClient.invalidateQueries({ queryKey: appQueryKeys.socialFollowingIds(userId) });
    queryClient.invalidateQueries({ queryKey: appQueryKeys.socialProfileStats(userId) });
    queryClient.invalidateQueries({ queryKey: ['social', 'search'] });
  };

  const addFollowMut = useMutation({
    mutationFn: (followingId: string) => addFollow(userId!, followingId),
    onSuccess: () => invalidate(),
  });

  const removeFollowMut = useMutation({
    mutationFn: (followingId: string) => removeFollow(userId!, followingId),
    onSuccess: () => invalidate(),
  });

  return { addFollow: addFollowMut, removeFollow: removeFollowMut };
}

export function useLikeMutation() {
  const queryClient = useQueryClient();

  const updateLikedInCache = (postId: string, liked: boolean) => {
    queryClient.setQueriesData<{ posts: SocialFeedPost[]; stories: SocialFeedPost[] }>(
      { queryKey: ['social', 'feedPosts'] },
      (old) => {
        if (!old) return old;
        const updater = (p: SocialFeedPost) =>
          p.id === postId
            ? { ...p, cheeredByMe: liked, like_count: Math.max((p.like_count || 0) + (liked ? 1 : -1), 0) }
            : p;
        return { posts: old.posts.map(updater), stories: old.stories.map(updater) };
      },
    );
  };

  return useMutation({
    mutationFn: async ({ postId, liked, userId }: { postId: string; liked: boolean; userId: string }) => {
      if (liked) await addLike(postId, userId);
      else await removeLike(postId, userId);
    },
    onMutate: ({ postId, liked }) => { updateLikedInCache(postId, liked); },
    onError: (_err, { postId, liked }) => { updateLikedInCache(postId, !liked); },
  });
}
