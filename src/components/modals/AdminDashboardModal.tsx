import React, { useEffect, useState } from 'react';
import { X, Loader2, Users, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { fetchAdminMetrics } from '@/lib/adminQueries';

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

export default function AdminDashboardModal({ onClose }: { onClose: () => void }) {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminMetrics()
      .then(setMetrics)
      .catch((err) => setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu'))
      .finally(() => setLoading(false));
  }, []);

  const statCard = (label: string, value: string | number, icon: React.ReactNode, color: string) => (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-black text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" /> Admin</h2>
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
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {metrics && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {statCard('DAU', metrics.dau, <Users size={16} />, 'bg-blue-500/20 text-blue-400')}
              {statCard('Tổng user', metrics.totalUsers, <Users size={16} />, 'bg-indigo-500/20 text-indigo-400')}
              {statCard('Premium', metrics.totalPremium, <DollarSign size={16} />, 'bg-amber-500/20 text-amber-400')}
              {statCard('MRR (VNĐ)', `${metrics.mrr.toLocaleString()}đ`, <DollarSign size={16} />, 'bg-emerald-500/20 text-emerald-400')}
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-400 font-bold mb-3">Retention</p>
              <div className="flex gap-4">
                {[
                  { label: 'D1', value: `${metrics.retentionD1}%` },
                  { label: 'D7', value: `${metrics.retentionD7}%` },
                  { label: 'D30', value: `${metrics.retentionD30}%` },
                ].map(r => (
                  <div key={r.label} className="flex-1 text-center">
                    <p className="text-2xl font-black text-white">{r.value}</p>
                    <p className="text-xs text-slate-500">{r.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
              <p className="text-sm text-slate-300 font-bold">Churn rate</p>
              <p className={`text-lg font-black ${metrics.churnRate > 30 ? 'text-red-400' : 'text-emerald-400'}`}>{metrics.churnRate}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
