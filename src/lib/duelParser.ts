import type { SocialFeedPost } from '../models';

export function parseDuelContent(content: string, post?: SocialFeedPost, t?: (key: string) => string) {
  const _t = t || ((s: string) => s);
  const lines = content.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const prefixes = [_t('feed.duel_goal'), _t('feed.duel_deadline'), _t('feed.duel_type'), _t('feed.duel_bet')];
  const getValue = (prefix: string) => lines.find(line => line.startsWith(prefix))?.replace(prefix, '').trim();
  const main = lines.filter(line => !prefixes.some(prefix => line.startsWith(prefix))).join(' ');

  const stakeFromCoins = post?.stake_coins ? `${post.stake_coins} xu` : null;
  const targetFromMl = post?.hydration_ml ? `${post.hydration_ml}ml` : null;

  return {
    main: main || content,
    target: targetFromMl || getValue(_t('feed.duel_goal')),
    deadline: getValue(_t('feed.duel_deadline')) || _t('feed.duel_today'),
    mode: getValue(_t('feed.duel_type')) || _t('feed.duel_challenge_friends'),
    stake: stakeFromCoins || getValue(_t('feed.duel_bet')) || _t('feed.duel_no_bet'),
  };
}

export function parseDuelTargetToMl(target: string | undefined): number {
  if (!target) return 2000;
  const match = target.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 2000;
}

export function parseDuelDeadlineToISO(deadline: string | undefined, t?: (key: string) => string): string | null {
  const _t = t || ((s: string) => s);
  if (!deadline || deadline === _t('feed.duel_today')) return null;
  const now = new Date();
  const timeMatch = deadline.match(/(\d{1,2}):(\d{2})/);
  const isTomorrow = deadline.includes('ngày mai');
  const isMinutes = deadline.includes('phút');
  const d = new Date(now);
  if (isTomorrow) d.setDate(d.getDate() + 1);
  if (isMinutes) {
    const minMatch = deadline.match(/(\d+)\s*phút/);
    if (minMatch) d.setMinutes(d.getMinutes() + parseInt(minMatch[1], 10));
  } else if (deadline.includes(_t('feed.end_of_day'))) {
    d.setHours(23, 59, 0, 0);
  } else if (timeMatch) {
    d.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
  }
  return d.toISOString();
}
