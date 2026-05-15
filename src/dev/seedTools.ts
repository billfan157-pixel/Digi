import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const sampleQuests = [
  { type: 'daily', title: 'Khởi động', description: 'Uống ít nhất 500ml', condition_type: 'drink_today', condition_value: 500 },
  { type: 'daily', title: 'Nửa chặng', description: 'Đạt 50% mục tiêu', condition_type: 'goal_percent', condition_value: 50 },
  { type: 'weekly', title: 'Tuần lễ nước', description: '5 ngày trong tuần', condition_type: 'drink_weekly_days', condition_value: 5 },
  { type: 'level', title: 'Đạt Level 1', description: 'Lên cấp độ đầu tiên', condition_type: 'level', condition_value: 1, min_level: 1 },
  { type: 'level', title: 'Đạt Level 2', description: 'Lên cấp độ 2', condition_type: 'level', condition_value: 2, min_level: 2 },
  { type: 'level', title: 'Đạt Level 3', description: 'Lên cấp độ 3', condition_type: 'level', condition_value: 3, min_level: 3 },
  { type: 'level', title: 'Đạt Level 4', description: 'Lên cấp độ 4', condition_type: 'level', condition_value: 4, min_level: 4 },
  { type: 'level', title: 'Đạt Level 5', description: 'Lên cấp độ 5', condition_type: 'level', condition_value: 5, min_level: 5 },
  { type: 'level', title: 'Người mới bắt đầu', description: '3 ngày liên tục', condition_type: 'drink_streak', condition_value: 3 },
  { type: 'level', title: 'Tích lũy đầu tiên', description: '10.000ml tổng cộng', condition_type: 'drink_total', condition_value: 10000 },
];

export const seedSampleQuests = async () => {
  const { data: existingQuests } = await supabase.from('quests').select('title');
  const existingTitles = new Set(existingQuests?.map((quest: { title: string }) => quest.title) || []);

  if (existingTitles.size > 0) {
    const shouldContinue = confirm(`Đã có ${existingTitles.size} quests. Tiếp tục seed sẽ tạo duplicate. Clear trước?`);
    if (!shouldContinue) {
      toast.info('Đã hủy seeding để tránh duplicate.');
      return;
    }
  }

  try {
    for (const quest of sampleQuests) {
      if (existingTitles.has(quest.title)) continue;

      await supabase.from('quests').insert({
        type: quest.type,
        title: quest.title,
        description: quest.description,
        condition_type: quest.condition_type,
        condition_value: quest.condition_value,
        reward_exp: quest.condition_value >= 100 ? Math.floor(quest.condition_value / 10) : 50,
        reward_coins: quest.condition_value >= 100 ? Math.floor(quest.condition_value / 50) : 10,
        min_level: quest.min_level || 1,
        is_active: true,
      });
    }

    toast.success('Đã seed quest mẫu.');
  } catch (error) {
    console.error('[seedSampleQuests]', error);
    toast.error('Lỗi khi seed quests.');
  }
};

export const seedSampleWaterLogs = async (userId: string) => {
  if (!userId) return;

  const sampleLogs = [
    { amount: 250, name: 'Nước lọc', day: '2026-04-18' },
    { amount: 300, name: 'Cà phê', day: '2026-04-17' },
    { amount: 200, name: 'Trà xanh', day: '2026-04-16' },
    { amount: 350, name: 'Nước cam', day: '2026-04-15' },
    { amount: 250, name: 'Sinh tố', day: '2026-04-14' },
  ];

  try {
    for (const log of sampleLogs) {
      const fakeCreatedAt = new Date(`${log.day}T12:00:00Z`).toISOString();
      await supabase.from('water_logs').insert({
        user_id: userId,
        amount: log.amount,
        name: log.name,
        day: log.day,
        created_at: fakeCreatedAt,
        timestamp: fakeCreatedAt,
        exp: Math.floor(log.amount / 100) * 5,
      });
    }

    toast.success('Đã thêm sample data để test.');
    await seedSampleQuests();
  } catch (error) {
    console.error('[seedSampleWaterLogs]', error);
    toast.error('Lỗi khi seed water logs.');
  }
};
