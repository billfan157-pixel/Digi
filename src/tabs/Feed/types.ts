import type { Profile, SocialFeedPost } from '../../models';
import type { CloseCircleMember } from '../../lib/social';

export type FeedFilter = 'all' | 'checkins' | 'drops' | 'milestones' | 'challenges' | 'photos';
export type FeedMode = 'smart' | 'latest' | 'following';
export type SignaturePostKind = 'pulse' | 'drop' | 'peak' | 'duel' | 'proof';
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
  closeCircleMembers: CloseCircleMember[];
  closeCircleIds: string[];
  isCloseCircleLoading: boolean;
  openSocialComposer: (kind: SocialComposerKind) => void;
  openQuickDropCamera: () => void;
  setShowSocialProfile: (show: boolean) => void;
  setShowDiscoverPeople: (show: boolean) => void;
  handleToggleLikePost: (post: SocialFeedPost) => void;
}

export interface FeedSummary {
  postsToday: number;
  challengeCount: number;
  progressCount: number;
  storyCount: number;
}
