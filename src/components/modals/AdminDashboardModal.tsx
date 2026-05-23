import React, { useEffect, useState } from 'react';
import { X, Loader2, Users, TrendingUp, DollarSign, AlertTriangle, Download, ClipboardList } from 'lucide-react';
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

export default function AdminDashboardModal({ onClose }: { onClose: () => void }) {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Waitlist states
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);

  useEffect(() => {
    // Fetch metrics
    fetchAdminMetrics()
      .then(setMetrics)
      .catch((err) => setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu metrics'))
      .finally(() => setLoading(false));

    // Fetch waitlist entries
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
  }, []);

  const handleExportCSV = () => {
    if (waitlistEntries.length === 0) {
      toast.error('Không có dữ liệu danh sách chờ để xuất.');
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
    toast.success('Xuất file CSV thành công!');
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

  // Compute waitlist statistics
  const totalWaitlistCount = waitlistEntries.length;
  const standardCount = waitlistEntries.filter(e => e.tier_interest === 'standard').reduce((sum, e) => sum + e.quantity, 0);
  const proKitCount = waitlistEntries.filter(e => e.tier_interest === 'pro_kit').reduce((sum, e) => sum + e.quantity, 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-cyan-400" /> Admin Control Room
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
            {/* Core Stats Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Hệ thống & Tài chính</h3>
              <div className="grid grid-cols-2 gap-3">
                {statCard('DAU (24h)', metrics.dau, <Users size={16} />, 'bg-blue-500/20 text-blue-400')}
                {statCard('Tổng người dùng', metrics.totalUsers, <Users size={16} />, 'bg-indigo-500/20 text-indigo-400')}
                {statCard('Premium Active', metrics.totalPremium, <DollarSign size={16} />, 'bg-amber-500/20 text-amber-400')}
                {statCard('MRR Ước Tính', `${metrics.mrr.toLocaleString()}đ`, <DollarSign size={16} />, 'bg-emerald-500/20 text-emerald-400')}
              </div>
            </div>

            {/* Retention & Churn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-400 font-bold mb-3">Tỷ lệ giữ chân (Retention)</p>
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
                <p className="text-xs text-slate-400 font-bold mb-1">Tỷ lệ Churn</p>
                <div className="flex items-baseline justify-between">
                  <p className={`text-2xl font-black ${metrics.churnRate > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {metrics.churnRate}%
                  </p>
                  <span className="text-[10px] text-slate-500">Checkout thất bại/Hủy</span>
                </div>
              </div>
            </div>

            {/* DigiBottle Waitlist Panel */}
            <div className="p-5 rounded-2xl bg-slate-950/40 border border-cyan-500/20 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-cyan-400" size={16} />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Danh sách chờ DigiBottle</h3>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <Download size={12} />
                  CSV
                </button>
              </div>

              {loadingWaitlist ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={16} className="animate-spin text-cyan-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Waitlist breakdown counts */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                      <p className="text-xs text-slate-500 font-bold">Lượt đăng ký</p>
                      <p className="text-base font-black text-white mt-1">{totalWaitlistCount}</p>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                      <p className="text-xs text-slate-500 font-bold">Bình Standard</p>
                      <p className="text-base font-black text-cyan-400 mt-1">{standardCount}</p>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                      <p className="text-xs text-slate-500 font-bold">Bộ Pro Kit</p>
                      <p className="text-base font-black text-amber-400 mt-1">{proKitCount}</p>
                    </div>
                  </div>

                  {/* List of recent signups */}
                  {waitlistEntries.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-800/80 rounded-xl p-2 bg-slate-900/40 custom-scrollbar">
                      {waitlistEntries.slice(0, 10).map((entry) => (
                        <div key={entry.id} className="flex justify-between items-center text-[10px] p-2 rounded-lg bg-slate-900/60 border border-slate-800/40">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-white font-bold truncate">{entry.email}</p>
                            <p className="text-slate-500 mt-0.5">{new Date(entry.created_at).toLocaleString('vi-VN')}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`px-2 py-0.5 rounded font-black uppercase text-[8px] ${entry.tier_interest === 'pro_kit' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                              {entry.tier_interest === 'pro_kit' ? 'Pro' : 'Std'}
                            </span>
                            <span className="text-slate-400 font-bold ml-2">x{entry.quantity}</span>
                          </div>
                        </div>
                      ))}
                      {waitlistEntries.length > 10 && (
                        <p className="text-center text-[9px] text-slate-500 font-bold pt-1">
                          Và {waitlistEntries.length - 10} lượt đăng ký khác...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-[10px] text-slate-500 py-4 font-bold">
                      Chưa có lượt đăng ký chờ nào.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
