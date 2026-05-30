import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedPostList } from './FeedPostList';
import type { SocialFeedPost } from '../../models';

vi.mock('./PostCard', () => ({
  PostCard: vi.fn(({ post }: { post: SocialFeedPost }) => (
    <div data-testid={`post-card-${post.id}`}>{post.content}</div>
  )),
}));

vi.mock('./SkeletonCard', () => ({
  SkeletonCard: vi.fn(() => <div data-testid="skeleton-card" />),
}));

function makePost(overrides: Partial<SocialFeedPost> = {}): SocialFeedPost {
  return {
    id: 'post-1',
    author_id: 'author-1',
    content: 'Test post content',
    image_url: null,
    post_kind: 'status',
    visibility: 'public',
    hydration_ml: null,
    streak_snapshot: null,
    like_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    expires_at: null,
    event_type: null,
    reference_id: null,
    is_squad_highlight: false,
    stake_coins: null,
    ...overrides,
  };
}

describe('FeedPostList', () => {
  const baseProps = {
    currentUserId: 'user-1',
    handleToggleLikePost: vi.fn(),
    onOpenComments: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error banner when socialError is set', () => {
    render(
      <FeedPostList
        posts={[]}
        isLoading={false}
        socialError="Network error"
        {...baseProps}
      />
    );
    expect(screen.getByText('Không tải được feed')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders skeleton cards when loading with no posts', () => {
    const { container } = render(
      <FeedPostList
        posts={[]}
        isLoading={true}
        socialError=""
        {...baseProps}
      />
    );
    const skeletons = container.querySelectorAll('[data-testid="skeleton-card"]');
    expect(skeletons.length).toBe(3);
  });

  it('does not render skeletons when loading but posts exist', () => {
    render(
      <FeedPostList
        posts={[makePost({ id: 'post-1' })]}
        isLoading={true}
        socialError=""
        {...baseProps}
      />
    );
    expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
    expect(screen.getByText('Test post content')).toBeInTheDocument();
  });

  it('renders post cards for each post', () => {
    const posts = [
      makePost({ id: 'post-1', content: 'First post' }),
      makePost({ id: 'post-2', content: 'Second post' }),
    ];
    render(
      <FeedPostList
        posts={posts}
        isLoading={false}
        socialError=""
        {...baseProps}
      />
    );
    expect(screen.getByText('First post')).toBeInTheDocument();
    expect(screen.getByText('Second post')).toBeInTheDocument();
  });

  it('virtualizes long post lists instead of rendering every post card', () => {
    const posts = Array.from({ length: 100 }, (_, index) =>
      makePost({ id: `post-${index + 1}`, content: `Post ${index + 1}` })
    );

    render(
      <FeedPostList
        posts={posts}
        isLoading={false}
        socialError=""
        {...baseProps}
      />
    );

    expect(screen.getAllByTestId(/^post-card-/).length).toBeLessThan(posts.length);
    expect(screen.getByText('Post 1')).toBeInTheDocument();
    expect(screen.queryByText('Post 100')).not.toBeInTheDocument();
  });

  it('renders nothing when posts empty and not loading, no error', () => {
    const { container } = render(
      <FeedPostList
        posts={[]}
        isLoading={false}
        socialError=""
        {...baseProps}
      />
    );
    expect(container.textContent).toBe('');
  });

  it('prioritizes error banner over content', () => {
    const posts = [makePost()];
    render(
      <FeedPostList
        posts={posts}
        isLoading={false}
        socialError="DB error"
        {...baseProps}
      />
    );
    expect(screen.getByText('Không tải được feed')).toBeInTheDocument();
    expect(screen.queryByText('Test post content')).not.toBeInTheDocument();
  });
});
