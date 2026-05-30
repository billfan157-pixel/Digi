import React, { useEffect, useState } from 'react';
import { X, Loader2, Users, TrendingUp, DollarSign, AlertTriangle, Download, ClipboardList, UserCheck, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchAdminMetrics } from '@/lib/adminQueries';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

interface WaitlistEntry {
  id: string;
  email: string;
  tier_interest: string;
  quantity: number;
  created_at: string;
  status: string;
}

type StatusFilter = 'all' | 'pending' | 'notified' | 'cancelled';

export default function AdminDashboardModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminMetrics()
      .then(setMetrics)
      .catch((err) => setError(err instanceof Error ? err.message : t('admin.metrics_error')))
      .finally(() => setLoading(false));

    const fetchWaitlist = async () => {
      setLoadingWaitlist(true);
      try {
        const { data, error } = await supabase
          .from('hardware_waitlist')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWaitlistEntries(data || []);
      } catch (err) {
        console.error('Error fetching waitlist:', err);
      } finally {
        setLoadingWaitlist(false);
      }
    };

    fetchWaitlist();
  }, [t]);

  const handleExportCSV = () => {
    if (waitlistEntries.length === 0) {
      toast.error(t('admin.no_data_export'));
      return;
    }

    const headers = ['Email', 'Version', 'Quantity', 'Registered At', 'Status'];
    const rows = waitlistEntries.map(entry => [
      entry.email,
      entry.tier_interest === 'pro_kit' ? 'Pro Kit' : 'Standard',
      entry.quantity,
      new Date(entry.created_at).toLocaleDateString('vi-VN'),
      entry.status
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `digibottle_waitlist_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('admin.export_csv_success'));
  };

  const handleStatusUpdate = async (entry: WaitlistEntry, newStatus: string) => {
    const confirmMsg = newStatus === 'notified'
      ? t('admin.select_confirm', { email: entry.email })
      : t('admin.reject_confirm', { email: entry.email });

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(entry.id);
    try {
      const { error } = await supabase
        .from('hardware_waitlist')
        .update({ status: newStatus })
        .eq('id', entry.id);

      if (error) throw error;

      setWaitlistEntries(prev =>
        prev.map(e => e.id === entry.id ? { ...e, status: newStatus } : e)
      );

      toast.success(
        newStatus === 'notified'
          ? t('admin.select_success', { email: entry.email })
          : t('admin.reject_success', { email: entry.email })
      );
    } catch {
      toast.error(t('admin.action_error'));
    } finally {
      setActionLoading(null);
    }
  };

  const statCard = (label: string, value: string | number, icon: React.ReactNode, color: string) => (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-black text-white">{value}</p>
      </div>
    </div>
  );

  const totalWaitlistCount = waitlistEntries.length;
  const standardCount = waitlistEntries.filter(e => e.tier_interest === 'standard').reduce((sum, e) => sum + e.quantity, 0);
  const proKitCount = waitlistEntries.filter(e => e.tier_interest === 'pro_kit').reduce((sum, e) => sum + e.quantity, 0);

  const filteredEntries = statusFilter === 'all'
    ? waitlistEntries
    : waitlistEntries.filter(e => e.status === statusFilter);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-400',
      notified: 'bg-cyan-500/10 text-cyan-400',
      purchased: 'bg-emerald-500/10 text-emerald-400',
      cancelled: 'bg-slate-500/10 text-slate-400',
    };
    return map[status] || 'bg-slate-500/10 text-slate-400';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: t('admin.pending_status'),
      notified: t('admin.filter_notified'),
      purchased: t('admin.beta_confirmed'),
      cancelled: t('admin.beta_rejected'),
    };
    return map[status] || status;
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('admin.filter_all') },
    { key: 'pending', label: t('admin.filter_pending') },
    { key: 'notified', label: t('admin.filter_beta') },
    { key: 'cancelled', label: t('admin.filter_rejected') },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-cyan-400" /> {t('admin.title')}
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 mb-4">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {metrics && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">{t('admin.system_finance')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {statCard(t('admin.dau'), metrics.dau, <Users size={16} />, 'bg-blue-500/20 text-blue-400')}
                {statCard(t('admin.total_users'), metrics.totalUsers, <Users size={16} />, 'bg-indigo-500/20 text-indigo-400')}
                {statCard(t('admin.premium_active'), metrics.totalPremium, <DollarSign size={16} />, 'bg-amber-500/20 text-amber-400')}
                {statCard(t('admin.estimated_mrr'), `${metrics.mrr.toLocaleString()}đ`, <DollarSign size={16} />, 'bg-emerald-500/20 text-emerald-400')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-400 font-bold mb-3">{t('admin.retention')}</p>
                <div className="flex gap-4">
                  {[
                    { label: 'D1', value: `${metrics.retentionD1}%` },
                    { label: 'D7', value: `${metrics.retentionD7}%` },
                    { label: 'D30', value: `${metrics.retentionD30}%` },
                  ].map(r => (
                    <div key={r.label} className="flex-1 text-center">
                      <p className="text-lg font-black text-white">{r.value}</p>
                      <p className="text-[10px] text-slate-500">{r.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col justify-center">
                <p className="text-xs text-slate-400 font-bold mb-1">{t('admin.churn_rate')}</p>
                <div className="flex items-baseline justify-between">
                  <p className={`text-2xl font-black ${metrics.churnRate > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {metrics.churnRate}%
                  </p>
                  <span className="text-[10px] text-slate-500">Checkout thất bại/Hủy</span>
                </div>
              </div>
            </div>

            {/* DigiBottle Waitlist + Beta Tester Panel */}
            <div className="p-5 rounded-2xl bg-slate-950/40 border border-cyan-500/20 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-cyan-400" size={16} />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">{t('admin.waitlist_panel')}</h3>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <Download size={12} />
                  {t('admin.export_csv')}
                </button>
              </div>

              {/* Beta Tester Management Section */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <UserCheck size={14} /> {t('admin.beta_panel')}
                </h4>

                {/* Status filter tabs */}
                <div className="flex gap-1 mb-3 flex-wrap">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                        statusFilter === f.key
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {loadingWaitlist ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={16} className="animate-spin text-cyan-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                        <p className="text-xs text-slate-500 font-bold">{t('admin.total_registrations')}</p>
                        <p className="text-base font-black text-white mt-1">{totalWaitlistCount}</p>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                        <p className="text-xs text-slate-500 font-bold">{t('admin.standard_bottles')}</p>
                        <p className="text-base font-black text-cyan-400 mt-1">{standardCount}</p>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                        <p className="text-xs text-slate-500 font-bold">{t('admin.pro_kits')}</p>
                        <p className="text-base font-black text-amber-400 mt-1">{proKitCount}</p>
                      </div>
                    </div>

                    {filteredEntries.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-800/80 rounded-xl p-2 bg-slate-900/40 custom-scrollbar">
                        {filteredEntries.map((entry) => (
                          <div key={entry.id} className="flex items-center text-[10px] p-2 rounded-lg bg-slate-900/60 border border-slate-800/40 gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-bold truncate">{entry.email}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-1.5 py-0.5 rounded font-black uppercase text-[8px] ${statusBadge(entry.status)}`}>
                                  {statusLabel(entry.status)}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded font-black uppercase text-[8px] ${entry.tier_interest === 'pro_kit' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                  {entry.tier_interest === 'pro_kit' ? 'Pro' : 'Std'}
                                </span>
                                <span className="text-slate-500">x{entry.quantity}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {entry.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(entry, 'notified')}
                                    disabled={actionLoading === entry.id}
                                    className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50 transition-all"
                                    title={t('admin.select_beta')}
                                  >
                                    {actionLoading === entry.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(entry, 'cancelled')}
                                    disabled={actionLoading === entry.id}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all"
                                    title={t('admin.reject_beta')}
                                  >
                                    <UserX size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        {statusFilter === 'all' && waitlistEntries.length > filteredEntries.length && (
                          <p className="text-center text-[9px] text-slate-500 font-bold pt-1">
                            {t('admin.and_more', { count: waitlistEntries.length - filteredEntries.length })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-[10px] text-slate-500 py-4 font-bold">
                        {t('admin.no_registrations')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
