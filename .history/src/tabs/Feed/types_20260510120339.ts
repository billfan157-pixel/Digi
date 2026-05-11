import type { Profile, SocialFeedPost } from '../../models';

export type FeedFilter = 'all' | 'milestones' | 'challenges' | 'tips' | 'polls' | 'photos';
export type FeedMode = 'smart' | 'latest' | 'following';
export type SocialComposerKind = 'status' | 'progress' | 'story' | 'challenge' | 'tip' | 'poll' | 'photo';

export type TipCategory = 'science' | 'practical' | 'recipe';

export interface PostComposerAction {
  kind: SocialComposerKind;
  label: string;
  icon: string;
  gradient: string;
}

export interface FeedTabProps {
  profile: Profile | null;
  socialStories: SocialFeedPost[];
  socialError: string;
  isSocialLoading: boolean;
  socialFollowingIds: string[];
  openSocialComposer: (kind: SocialComposerKind) => void;
  setShowSocialProfile: (show: boolean) => void;
  setShowDiscoverPeople: (show: boolean) => void;
  handleToggleLikePost: (post: SocialFeedPost) => void;
}

export interface FeedSummary {
  postsToday: number;
  challengeCount: number;
  progressCount: number;
  storyCount: number;
  tipCount: number;
  pollCount: number;
}
