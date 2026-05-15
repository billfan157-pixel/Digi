function timeToMinutes(time: string): number {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

interface FeedPostLike {
  author_id?: string;
  created_at?: string;
  likes?: number;
  comments?: number;
  activity?: string;
  hydration_ml?: number;
  value?: number;
  water_goal?: number;
  drink_type?: string;
  type?: string;
  author?: {
    age?: number;
    wake_up?: string;
  };
  [key: string]: unknown;
}

interface FeedUserLike {
  activity?: string;
  water_goal?: number;
  age?: number;
  favorite_drink?: string;
  wakeUp?: string;
  [key: string]: unknown;
}

export function rankFeedPosts(posts: FeedPostLike[], followingIds: string[], currentUser?: FeedUserLike) {
  if (!posts || posts.length === 0) return [];

  const now = new Date().getTime();

  const scoredPosts = posts.map(post => {
    let score = 0;

    const isFollowing = followingIds?.includes(post.author_id ?? '');
    if (isFollowing) score += 500;

    const postTime = new Date(post.created_at ?? '').getTime();
    const hoursAgo = (now - postTime) / (1000 * 60 * 60);
    score += Math.max(0, 200 - (hoursAgo * 5));

    const likes = post.likes || 0;
    const comments = post.comments || 0;
    score += (likes * 5) + (comments * 10);

    if (currentUser && post.author) {
      if (post.activity && currentUser.activity && post.activity === currentUser.activity) {
        score += 30;
      }

      const postWater = post.hydration_ml || post.value || 0;
      const myGoal = currentUser.water_goal || 2000;
      if (postWater > 0 && myGoal > 0) {
        if (postWater >= myGoal * 0.8) score += 40;
      }

      if (post.type === 'challenge') {
        score += 80;
      }

      if (post.author.age && currentUser.age && Math.abs(post.author.age - currentUser.age) <= 5) {
        score += 25;
      }

      if (post.drink_type && currentUser.favorite_drink && post.drink_type === currentUser.favorite_drink) {
        score += 20;
      }

      if (post.author.wake_up && currentUser.wakeUp && Math.abs(timeToMinutes(post.author.wake_up) - timeToMinutes(currentUser.wakeUp)) <= 60) {
        score += 15;
      }
    }

    return { ...post, _score: score };
  });

  return scoredPosts.sort((a, b) => b._score - a._score);
}
