// ============================================================
// DigiWell — Quest Engine
// Chạy sau mỗi handleAddWater() / handleDeleteEntry()
// Tự động check tất cả điều kiện và cập nhật tiến độ
// ============================================================

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { UserQuest, UserChallenge, ConditionType } from '../config/questConfig';
import { normalizeQuestConditionType, resolveQuestProgress } from './questProgress';

// ── Context truyền vào engine ──────────────────────────────

export interface QuestEngineContext {
  userId:        string;
  waterToday:    number;   // ml uống hôm nay
  waterGoal:     number;   // ml mục tiêu hôm nay
  streak:        number;   // streak hiện tại (ngày)
  totalWater:    number;   // tổng ml tích lũy toàn thời gian
  logCountToday: number;   // số lần log hôm nay
  weeklyDays:    number;   // số ngày đạt mục tiêu trong tuần này
  weeklyWater?:  number;   // tổng ml trong 7 ngày gần nhất
  weeklyLogCount?: number; // tổng số lần log trong 7 ngày gần nhất
  equippedSound?: string | null;
  level:         number;   // cấp độ hiện tại của user
}

const challengeEngineInFlight = new Map<string, Promise<void>>();
const challengeEngineQueuedCtx = new Map<string, QuestEngineContext>();

// ── Check một điều kiện ────────────────────────────────────

function checkCondition(
  questData: any,
  ctx: QuestEngineContext
): { progress: number; completed: boolean } {
  const result = resolveQuestProgress(questData, ctx);
  console.log(
    `[QuestEngine] condition=${result.normalizedType}, current=${result.current}, value=${result.target}, progress=${result.progress}, completed=${result.completed}`,
  );
  return result;
}

// ── Main engine: chạy sau mỗi water event ─────────────────

export async function runQuestEngine(ctx: QuestEngineContext): Promise<void> {
  if (!ctx.userId) return;

  console.log('[QuestEngine] Running with ctx:', ctx);

  try {
    // 1. Tự động cấp phát nhiệm vụ trước khi chấm điểm để không bao giờ bị trễ nhịp
    await provisionUserQuests(ctx.userId, ctx.level);

    // 2. Lấy tất cả quest đang active của user
    const { data: userQuests, error } = await supabase
      .from('user_quests')
      .select(`
        id, quest_id, status, progress,
        quest:quests (
          id, type, title, condition_type, condition_value,
          reward_exp, reward_coins, reward_badge_id, min_level
        )
      `)
      .eq('user_id', ctx.userId)
      .eq('status', 'active');

    if (error || !userQuests) return;

    const updates: Array<{
      id: string;
      progress: number;
      status: 'active' | 'completed';
      completed_at: string | null;
    }> = [];

    const newlyCompleted: UserQuest[] = [];

    for (const uq of userQuests as any[]) {
      // AN TOÀN: Bỏ qua nhiệm vụ bị xóa khỏi DB để tránh lỗi Null Pointer Exception
      const questData = Array.isArray(uq.quest) ? uq.quest[0] : uq.quest;
      if (!questData) continue;

      const { progress, completed } = checkCondition(
        questData,
        ctx
      );

      // Chỉ update nếu có thay đổi
      if (progress !== uq.progress || (completed && uq.status === 'active')) {
        updates.push({
          id:           uq.id,
          progress,
          status:       completed ? 'completed' : 'active',
          completed_at: completed ? new Date().toISOString() : null,
        });

        if (completed && uq.status === 'active') {
          newlyCompleted.push({ ...uq, quest: questData });
        }
      }
    }

    // Batch update
    if (updates.length > 0) {
      await Promise.allSettled(
        updates.map(async (u) => {
          const { data, error } = await supabase.from('user_quests').update({
            progress:     u.progress,
            status:       u.status,
            completed_at: u.completed_at,
          }).eq('id', u.id).select('id');
          
          if (error) console.error('[QuestEngine] Lỗi Update DB:', error.message);
          else if (!data || data.length === 0) {
            console.error(`[QuestEngine] RLS chặn update quest ${u.id}! Vui lòng chạy SQL cấp quyền UPDATE cho user_quests.`);
          }
        })
      );
    }

    // Notify user khi có quest hoàn thành
    for (const uq of newlyCompleted) {
      toast.success(`🎯 Hoàn thành: ${uq.quest.title} · ⚡ +${uq.quest.reward_exp} EXP!`, {
        duration: 4000,
        action: {
          label: '🎁 Nhận thưởng',
          onClick: () => claimQuestReward(ctx.userId, uq.id),
        },
      });

      // Bắn Push Notification
      await triggerRewardNotification(
        '🎯 Hoàn thành nhiệm vụ!',
        `${uq.quest.title} · ⚡ +${uq.quest.reward_exp} EXP & 💰 +${uq.quest.reward_coins} xu!`,
        uq.id,
        'quest',
        ctx.userId,
        ctx.equippedSound
      );
    }
  } catch (err) {
    console.error('[QuestEngine]', err);
  }
}

// ── Claim reward cho quest ─────────────────────────────────

export async function claimQuestReward(
  userId: string,
  userQuestId: string,
): Promise<any> {
  // Validate inputs
  if (!userId || userId === 'undefined' || !userQuestId || userQuestId === 'undefined') {
    console.error('[QuestEngine] Invalid parameters:', { userId, userQuestId });
    toast.error('Thông tin user không hợp lệ');
    return null;
  }

  console.log('[QuestEngine] Claiming quest:', { userId, userQuestId });

  const { data, error } = await supabase.rpc('claim_quest_reward', {
    p_user_id:       userId,
    p_user_quest_id: userQuestId,
  });

  if (error) {
    console.error('[QuestEngine] claimQuestReward error:', error);
    toast.error('Lỗi nhận thưởng: ' + error.message);
    return null;
  }

  if (data?.leveled_up) {
    toast.success(`⬆️ Level Up! Bạn đạt Level ${data.new_level}! 🎊`, { duration: 5000 });
  }
  if (data?.ranked_up) {
    toast.success(`⭐ Rank mới: ${data.new_rank}! 🏅`, { duration: 5000 });
  }

  toast.success('🎁 Đã nhận phần thưởng thành công!');
  
  // Kích hoạt ép tải lại Profile ngay lập tức để Vàng & EXP nảy số
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hydrationEvent', { detail: { refresh_profile: true } }));
  }

  return data || { success: true };
}

// ── Challenge engine: cập nhật tiến độ challenge ──────────

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

  // Tìm mốc mới vừa vượt qua
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

  // Award milestone rewards
  for (const m of newMilestones) {
    await supabase.rpc('award_exp_and_rank', {
      p_user_id: ctx.userId,
      p_exp:     m.exp,
      p_coins:   m.coins,
    });

    if (m.badge_id) {
      await supabase
        .from('user_badges')
        .insert({ user_id: ctx.userId, badge_id: m.badge_id })
        .on('conflict', 'ignore');
    }

    toast.success(`🏔️ Mốc ${m.label}: ⚡ +${m.exp} EXP · 💰 +${m.coins} xu!`, { duration: 4000 });
  }

  if (isCompleted) {
    toast.success(`🎉 Hoàn thành: ${ch.title}!`, {
      duration: 5000,
      action: { label: '🎁 Nhận thưởng', onClick: () => claimChallengeReward(ctx.userId, uc.id) },
    });
    // Bắn Push Notification
    await triggerRewardNotification('🎉 Hoàn thành thử thách!', ch.title, uc.id, 'challenge', ctx.userId, ctx.equippedSound);
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
    .lte('day', todayKey);

  if (error) {
    console.error('[ChallengeEngine] time_limited logs fetch failed:', error);
    return;
  }

  const totalsByDay = new Map<string, number>();
  for (const log of logs ?? []) {
    const dayKey = String((log as any).day || '');
    if (!dayKey) continue;
    totalsByDay.set(dayKey, (totalsByDay.get(dayKey) || 0) + Number((log as any).amount || 0));
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
    toast.error(`💔 Thất bại: ${ch.title} — Bạn có thể thử lại!`);
  }
  if (isCompleted) {
    toast.success(`🎉 Hoàn thành: ${ch.title}!`, {
      duration: 5000,
      action: { label: '🎁 Nhận thưởng', onClick: () => claimChallengeReward(ctx.userId, uc.id) },
    });
    // Bắn Push Notification
    await triggerRewardNotification('🎉 Hoàn thành thử thách!', ch.title, uc.id, 'challenge', ctx.userId, ctx.equippedSound);
  }
}

// ── Claim challenge reward ─────────────────────────────────

export async function claimChallengeReward(
  userId: string,
  userChallengeId: string,
): Promise<any> {
  const { error } = await supabase.rpc('claim_challenge_reward', {
    p_user_id:              userId,
    p_user_challenge_id:    userChallengeId,
  });

  if (error) {
    toast.error('Lỗi nhận thưởng: ' + error.message);
    return null;
  }

  toast.success('🎁 Đã nhận phần thưởng thành công!');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hydrationEvent', { detail: { refresh_profile: true } }));
  }
  
  return { success: true };
}

// ── Provision daily/weekly quests cho user mới ────────────
// Gọi khi user đăng nhập lần đầu hoặc sau reset

interface QuestRow {
  id: string;
  type: string;
  min_level: number;
}

export async function provisionUserQuests(userId: string, userLevel: number): Promise<void> {
  try {
    const today    = new Date().toLocaleDateString('en-CA');
    const weekStart = getWeekStart();

    // Lấy tất cả quest phù hợp với level của user
    const { data: quests } = await supabase
        .from('quests')
      .select('id, type, min_level')
      .eq('is_active', true)
      .lte('min_level', userLevel);

    if (!quests || quests.length === 0) return;

    // Lấy danh sách nhiệm vụ đã có để JS tự filter (chống lỗi DB constraint làm văng app)
    const { data: existing } = await supabase
      .from('user_quests')
      .select('quest_id, reset_date')
      .eq('user_id', userId);
      
    const existingSet = new Set((existing || []).map((uq: any) => `${uq.quest_id}-${uq.reset_date || 'null'}`));

    const rows = [];
    for (const q of quests as QuestRow[]) {
      const resetDate = q.type === 'daily' ? today : q.type === 'weekly' ? weekStart : null;
      const key = `${q.id}-${resetDate || 'null'}`;
      
      if (!existingSet.has(key)) {
        rows.push({
          user_id:    userId,
          quest_id:   q.id,
          status:     'active',
          progress:   0,
          reset_date: resetDate,
        });
      }
    }

    if (rows.length > 0) {
      await supabase.from('user_quests').insert(rows);
    }
  } catch (err) {
    console.error('[provisionUserQuests] Lỗi cấp phát:', err);
  }
}

export async function syncLevelQuestProgress(userId: string, userLevel: number): Promise<void> {
  if (!userId) return;

  try {
    const { data: userQuests, error } = await supabase
      .from('user_quests')
      .select(`
        id, status, progress, completed_at,
        quest:quests (
          id, type, title, condition_type, condition_value
        )
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'completed']);

    if (error || !userQuests) return;

    const updates = (userQuests as any[])
      .map((uq) => {
        const questData = Array.isArray(uq.quest) ? uq.quest[0] : uq.quest;
        if (!questData) return null;

        const normalizedType = normalizeQuestConditionType(questData.condition_type, questData.title);
        if (normalizedType !== 'level') return null;

        const result = resolveQuestProgress(questData, { level: userLevel });
        const nextStatus = result.completed ? 'completed' : 'active';

        if (
          uq.progress === result.progress &&
          uq.status === nextStatus &&
          Boolean(uq.completed_at) === result.completed
        ) {
          return null;
        }

        return {
          id: uq.id,
          progress: result.progress,
          status: nextStatus,
          completed_at: result.completed ? uq.completed_at || new Date().toISOString() : null,
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        progress: number;
        status: 'active' | 'completed';
        completed_at: string | null;
      }>;

    if (updates.length === 0) return;

    await Promise.allSettled(
      updates.map((update) =>
        supabase
          .from('user_quests')
          .update({
            progress: update.progress,
            status: update.status,
            completed_at: update.completed_at,
          })
          .eq('id', update.id),
      ),
    );
  } catch (err) {
    console.error('[syncLevelQuestProgress]', err);
  }
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // thứ 2
  d.setDate(diff);
  return d.toLocaleDateString('en-CA');
}

// ── Reward Push Notification Helper ────────────────────────

export const triggerRewardNotification = async (title: string, body: string, recordId: string, type: 'quest' | 'challenge', userId?: string, equippedSound?: string | null) => {
  try {
    // 1. Thêm vào in-app notification (Quả chuông trong app)
    if (userId) {
      await supabase.from('notifications').insert({
        recipient_id: userId,
        actor_id: userId, // Tự user hoàn thành nhiệm vụ của chính mình
        type: type === 'quest' ? 'quest_completed' : 'challenge_completed',
        content: `${title} ${body}`,
        reference_id: recordId
      });
    }

    // 2. Đăng ký nút bấm "Nhận thưởng ngay" cho Push Notification ngoài màn hình khóa
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'QUEST_COMPLETED_ACTIONS',
        actions: [{ 
          id: type === 'quest' ? 'claim_quest' : 'claim_challenge', 
          title: '🎁 Nhận thưởng ngay' 
        }]
      }]
    });

    // Bắn Push Notification xuống máy người dùng
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Math.random() * 100000) + 5000,
        title: title,
        body: body,
        actionTypeId: 'QUEST_COMPLETED_ACTIONS',
        extra: { type: type, id: recordId },
        sound: equippedSound || 'tada.wav' // 🎵 Dùng âm thanh đã trang bị, fallback về tada!
      }]
    });
  } catch (e) {
    console.error(`[QuestEngine] Lỗi push notification cho ${type}:`, e);
  }
};
