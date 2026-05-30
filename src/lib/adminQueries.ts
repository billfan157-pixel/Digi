import i18n from '@/i18n';
import { supabase } from './supabase';

interface AdminMetrics {
  dau: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
  mrr: number;
  churnRate: number;
  totalUsers: number;
  totalPremium: number;
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error(i18n.t('common.not_authenticated'));

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error(i18n.t('common.access_denied'));

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

  const [dauResult, totalUsers, totalPremium, checkoutStarted, checkoutSuccess, cohortD1, cohortD7, cohortD30] =
    await Promise.all([
      supabase.from('analytics_events').select('user_id', { count: 'exact', head: true })
        .gte('created_at', daysAgo(1)),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .not('stripe_subscription_id', 'is', null),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true })
        .eq('event_name', 'checkout_started'),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true })
        .eq('event_name', 'checkout_success'),
      supabase.from('analytics_events').select('user_id', { count: 'exact', head: true })
        .gte('created_at', daysAgo(2))
        .lt('created_at', daysAgo(1)),
      supabase.from('analytics_events').select('user_id', { count: 'exact', head: true })
        .gte('created_at', daysAgo(8))
        .lt('created_at', daysAgo(7)),
      supabase.from('analytics_events').select('user_id', { count: 'exact', head: true })
        .gte('created_at', daysAgo(31))
        .lt('created_at', daysAgo(30)),
    ]);

  const dau = dauResult.count ?? 0;
  const d1 = cohortD1.count ?? 1;
  const d7 = cohortD7.count ?? 1;
  const d30 = cohortD30.count ?? 1;

  const retentionD1 = d1 > 0 ? Math.round((dau / d1) * 100) : 0;
  const retentionD7 = d7 > 0 ? Math.round((dau / d7) * 100) : 0;
  const retentionD30 = d30 > 0 ? Math.round((dau / d30) * 100) : 0;

  const started = checkoutStarted.count ?? 0;
  const succeeded = checkoutSuccess.count ?? 0;
  const churnRate = started > 0
    ? Math.round(((started - succeeded) / started) * 100)
    : 0;

  const mrr = (totalPremium.count ?? 0) * 79900 / 100;

  return {
    dau,
    retentionD1,
    retentionD7,
    retentionD30,
    mrr,
    churnRate,
    totalUsers: totalUsers.count ?? 0,
    totalPremium: totalPremium.count ?? 0,
  };
}
