import i18n from '@/i18n';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { UserChallenge } from '../config/questConfig';
import type { QuestEngineContext } from './questEngine';
import { triggerRewardNotification } from './questEngine';

const challengeEngineInFlight = new Map<string, Promise<void>>();
const challengeEngineQueuedCtx = new Map<string, QuestEngineContext>();

export async function runChallengeEngine(ctx: QuestEngineContext): Promise<void> {
  if (!ctx.userId) return;

  const running = challengeEngineInFlight.get(ctx.userId);
  if (running) {
    challengeEngineQueuedCtx.set(ctx.userId, ctx);
    return running;
  }

  const runner = (async () => {
    let nextCtx: QuestEngineContext | undefined = ctx;

    while (nextCtx) {
      challengeEngineQueuedCtx.delete(ctx.userId);
      await runChallengeEngineOnce(nextCtx);
      nextCtx = challengeEngineQueuedCtx.get(ctx.userId);
    }
  })().finally(() => {
    challengeEngineInFlight.delete(ctx.userId);
    challengeEngineQueuedCtx.delete(ctx.userId);
  });

  challengeEngineInFlight.set(ctx.userId, runner);
  return runner;
}

async function runChallengeEngineOnce(ctx: QuestEngineContext): Promise<void> {
  try {
    const { data: userChallenges, error } = await supabase
      .from('user_challenges')
      .select(`
        id, challenge_id, status, current_value, milestones_reached,
        days_completed, days_failed,
        challenge:challenges (
          id, type, slug, title, duration_days, target_percent,
          grace_days, target_value, milestones,
          reward_exp, reward_coins, reward_badge_id
        )
      `)
      .eq('user_id', ctx.userId)
      .eq('status', 'joined');

    if (error || !userChallenges) return;

    for (const uc of userChallenges as unknown as UserChallenge[]) {
      const ch = uc.challenge;

      if (ch.type === 'milestone') {
        await updateMilestoneChallenge(ctx, uc);
      } else if (ch.type === 'time_limited') {
        await updateTimeLimitedChallenge(ctx, uc);
      }
    }
  } catch (err) {
    console.error('[ChallengeEngine]', err);
  }
}

async function updateMilestoneChallenge(
  ctx: QuestEngineContext,
  uc: UserChallenge,
): Promise<void> {
  const ch            = uc.challenge;
  const newValue      = Math.max(ctx.totalWater, uc.current_value || 0);
  const milestones    = ch.milestones ?? [];
  const alreadyReached = uc.milestones_reached ?? [];

  const newMilestones = milestones
    .map((m, idx) => ({ ...m, idx }))
    .filter(m => m.at <= newValue && !alreadyReached.includes(m.idx));

  const isCompleted = ch.target_value != null && newValue >= ch.target_value;

  if (newValue === (uc.current_value || 0) && newMilestones.length === 0 && !isCompleted) {
    return;
  }

  await supabase
    .from('user_challenges')
    .update({
      current_value:      newValue,
      milestones_reached: [...alreadyReached, ...newMilestones.map(m => m.idx)],
      status:             isCompleted ? 'completed' : 'joined',
      completed_at:       isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', uc.id);

  for (const m of newMilestones) {
    await supabase.rpc('award_exp_and_rank', {
      p_user_id: ctx.userId,
      p_exp:     m.exp,
      p_coins:   m.coins,
    });

    if (m.badge_id) {
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', ctx.userId)
        .eq('badge_id', m.badge_id)
        .maybeSingle();
      
      if (existingBadge) continue;

      const { error: badgeError } = await supabase
        .from('user_badges')
        .insert({ user_id: ctx.userId, badge_id: m.badge_id });
      
      if (badgeError) {
        console.error('[ChallengeEngine] Lỗi cấp huy hiệu:', badgeError);
      }
    }

    toast.success(i18n.t('quest.milestone_reached', { label: m.label, exp: m.exp, coins: m.coins }), { duration: 4000 });
  }

  if (isCompleted) {
    toast.success(i18n.t('quest.challenge_completed', { title: ch.title }), {
      duration: 5000,
      action: { label: i18n.t('quest.claim_reward_btn'), onClick: () => claimChallengeReward(ctx.userId, uc.id) },
    });
    await triggerRewardNotification(i18n.t('quest.challenge_complete'), ch.title, uc.id, 'challenge', ctx.userId, ctx.equippedSound);
  }
}

async function updateTimeLimitedChallenge(
  ctx: QuestEngineContext,
  uc: UserChallenge,
): Promise<void> {
  const ch           = uc.challenge;
  const targetPct    = ch.target_percent ?? 90;
  const graceDays    = ch.grace_days     ?? 0;
  const todayKey     = new Date().toLocaleDateString('en-CA');
  const joinedDayKey = new Date(uc.joined_at).toLocaleDateString('en-CA');

  const { data: logs, error } = await supabase
    .from('water_logs')
    .select('day, amount')
    .eq('user_id', ctx.userId)
    .gte('day', joinedDayKey)
    .lte('day', todayKey)
    .limit(1000);

  if (error) {
    console.error('[ChallengeEngine] time_limited logs fetch failed:', error);
    return;
  }

  const totalsByDay = new Map<string, number>();
  for (const log of logs ?? []) {
    const logRow = log as { day: string; amount: number };
    const dayKey = String(logRow.day || '');
    if (!dayKey) continue;
    totalsByDay.set(dayKey, (totalsByDay.get(dayKey) || 0) + Number(logRow.amount || 0));
  }

  const dayKeys: string[] = [];
  const cursor = new Date(uc.joined_at);
  const today = new Date();
  cursor.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  while (cursor <= today) {
    dayKeys.push(cursor.toLocaleDateString('en-CA'));
    cursor.setDate(cursor.getDate() + 1);
  }

  let newDaysCompleted = 0;
  let newDaysFailed = 0;

  for (const dayKey of dayKeys) {
    const total = totalsByDay.get(dayKey) || 0;
    const pct = ctx.waterGoal > 0 ? Math.floor((total / ctx.waterGoal) * 100) : 0;

    if (pct >= targetPct) {
      newDaysCompleted++;
      continue;
    }

    if (dayKey !== todayKey) {
      newDaysFailed++;
    }
  }

  const isCompleted = ch.duration_days != null && newDaysCompleted >= ch.duration_days;
  const isFailed    = newDaysFailed > graceDays;

  await supabase
    .from('user_challenges')
    .update({
      days_completed: newDaysCompleted,
      days_failed:    newDaysFailed,
      status:         isCompleted ? 'completed' : isFailed ? 'failed' : 'joined',
      completed_at:   isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', uc.id);

  if (isFailed) {
    toast.error(i18n.t('quest.challenge_failed', { title: ch.title }));
  }
  if (isCompleted) {
    toast.success(i18n.t('quest.challenge_completed', { title: ch.title }), {
      duration: 5000,
      action: { label: i18n.t('quest.claim_reward_btn'), onClick: () => claimChallengeReward(ctx.userId, uc.id) },
    });
    await triggerRewardNotification(i18n.t('quest.challenge_complete'), ch.title, uc.id, 'challenge', ctx.userId, ctx.equippedSound);
  }
}

export async function claimChallengeReward(
  userId: string,
  userChallengeId: string,
): Promise<Record<string, unknown> | null> {
  const { error } = await supabase.rpc('claim_challenge_reward', {
    p_user_id:              userId,
    p_user_challenge_id:    userChallengeId,
  });

  if (error) {
    toast.error(i18n.t('quest.reward_error', { error: error.message }));
    return null;
  }

    toast.success(i18n.t('quest.reward_received'));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hydrationEvent', { detail: { refresh_profile: true } }));
  }
  
  return { success: true };
}
