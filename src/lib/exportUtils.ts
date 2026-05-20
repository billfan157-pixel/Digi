import { supabase } from './supabase';
import type { Profile, WaterLog, SocialFeedPost, SocialComment } from '@/models';
import { sanitizeHtml } from './sanitize';

interface ExportParams {
  profile: Profile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  weeklyChartData: { d: string; ml: number }[];
  waterEntries: WaterLog[];
  avgWeekly?: number;
  completionRate?: number;
  isWatchConnected?: boolean;
  watchData?: { heartRate?: number; steps?: number } | null;
}

interface ExportDataJSON {
  exportedAt: string;
  app: 'DigiWell';
  version: 1;
  profile: {
    nickname: string | null;
    age: number | null;
    height: number | null;
    weight: number | null;
    gender: string | null;
    goal: string | null;
    activity: string | null;
  };
  logs: { date: string; amount_ml: number; }[];
  summary: {
    total_ml: number;
    avg_daily: number;
    streak: number;
    completion_rate: number;
    total_logs: number;
  };
}

interface FullExportData {
  profile: Profile | null;
  waterLogs: WaterLog[];
  socialPosts: SocialFeedPost[];
  socialComments: SocialComment[];
  follows: { follower_id: string; following_id: string; created_at: string }[];
  aiData: {
    conversations: { id: string; title: string; created_at: string }[];
    reports: { period: string; created_at: string }[];
    usage: { action: string; created_at: string }[];
  };
  battles: {
    id: string; status: string; challenger_id: string; opponent_id: string;
    winner_id: string | null; stake_coins: number; created_at: string
  }[];
  clubs: {
    club_name: string; role: string; joined_at: string;
    messages: { content: string; created_at: string }[]
  }[];
  quests: {
    title: string; status: string; progress: number; claimed_at: string | null
  }[];
}

export async function exportFullDataAsJSON(data: FullExportData) {
  const { profile } = data;

  const json = {
    exportedAt: new Date().toISOString(),
    app: 'DigiWell',
    version: 2,
    profile: {
      nickname: profile?.nickname ?? null,
      age: profile?.age ?? null,
      height: profile?.height ?? null,
      weight: profile?.weight ?? null,
      gender: profile?.gender ?? null,
      goal: profile?.goal ?? null,
      activity: profile?.activity ?? null,
    },
    waterLogs: data.waterLogs.map(w => ({
      date: w.created_at,
      amount_ml: w.amount,
      drink_type: w.drink_type ?? null,
    })),
    socialPosts: data.socialPosts.map(p => ({
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      visibility: p.visibility,
    })),
    socialComments: data.socialComments.map(c => ({
      post_id: c.post_id,
      content: c.content,
      created_at: c.created_at,
    })),
    follows: data.follows.map(f => ({
      type: f.follower_id === profile?.id ? 'following' : 'follower',
      user_id: f.follower_id === profile?.id ? f.following_id : f.follower_id,
      since: f.created_at,
    })),
    aiData: {
      conversations: data.aiData.conversations.map(c => ({
        id: c.id, title: c.title, created_at: c.created_at,
      })),
      reports: data.aiData.reports.map(r => ({
        period: r.period, created_at: r.created_at,
      })),
      usage: data.aiData.usage.map(u => ({
        action: u.action, created_at: u.created_at,
      })),
    },
    battles: data.battles.map(b => ({
      id: b.id, status: b.status,
      opponent_id: b.challenger_id === profile?.id ? b.opponent_id : b.challenger_id,
      result: b.winner_id === profile?.id ? 'win' : b.winner_id === null ? 'draw' : 'loss',
      stake_coins: b.stake_coins, created_at: b.created_at,
    })),
    clubs: data.clubs.map(c => ({
      club_name: c.club_name, role: c.role, joined_at: c.joined_at,
      messages: c.messages.length,
    })),
    quests: data.quests.map(q => ({
      title: q.title, status: q.status, progress: q.progress / 100,
      claimed: !!q.claimed_at,
    })),
  };

  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadBlob(url, 'digiwell-full-export.json');
}

export async function fetchAllUserData(profileId: string): Promise<FullExportData> {
  const [profileRes, waterRes, postsRes, commentsRes, followsRes,
    aiConvRes, aiReportRes, aiUsageRes, battlesRes, clubMembersRes, questsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', profileId).single(),
    supabase.from('water_logs').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
    supabase.from('social_posts').select('*').eq('author_id', profileId).order('created_at', { ascending: false }),
    supabase.from('social_comments').select('*').eq('author_id', profileId).order('created_at', { ascending: false }),
    supabase.from('social_follows').select('*').or(`follower_id.eq.${profileId},following_id.eq.${profileId}`),
    supabase.from('ai_conversations').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
    supabase.from('ai_reports').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
    supabase.from('ai_usage').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
    supabase.from('hydration_battles').select('*').or(`challenger_id.eq.${profileId},opponent_id.eq.${profileId}`).order('created_at', { ascending: false }),
    supabase.from('club_members').select('*, clubs:club_id(name)').eq('user_id', profileId),
    supabase.from('user_quests').select('*, quests:quest_id(title)').eq('user_id', profileId),
  ]);

  const clubData = await Promise.all((clubMembersRes.data || []).map(async (cm) => {
    const { data: messages } = await supabase
      .from('club_messages').select('content, created_at')
      .eq('user_id', profileId).eq('club_id', cm.club_id)
      .order('created_at', { ascending: false }).limit(50);
    const clubInfo = cm.clubs as { name: string } | null;
    return {
      club_name: clubInfo?.name || 'Unknown',
      role: cm.role || 'member',
      joined_at: cm.joined_at || '',
      messages: messages || [],
    };
  }));

  return {
    profile: (profileRes.data ?? null) as unknown as Profile | null,
    waterLogs: waterRes.data || [],
    socialPosts: (postsRes.data || []) as unknown as SocialFeedPost[],
    socialComments: (commentsRes.data || []) as unknown as SocialComment[],
    follows: followsRes.data || [],
    aiData: {
      conversations: aiConvRes.data || [],
      reports: aiReportRes.data || [],
      usage: aiUsageRes.data || [],
    },
    battles: battlesRes.data || [],
    clubs: clubData,
    quests: (questsRes.data || []).map(q => {
      const questInfo = q.quests as { title: string } | null;
      return {
        title: questInfo?.title || 'Unknown',
        status: q.status || 'unknown',
        progress: q.progress || 0,
        claimed_at: q.claimed_at,
      };
    }),
  };
}

export function exportToJSON(params: ExportParams) {
  const { profile, waterIntake, waterGoal, streak, waterEntries } = params;
  const totalMl = waterEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const avgDaily = waterEntries.length > 0 ? Math.round(totalMl / waterEntries.length) : 0;

  const json: ExportDataJSON = {
    exportedAt: new Date().toISOString(),
    app: 'DigiWell',
    version: 1,
    profile: {
      nickname: profile?.nickname ?? null,
      age: profile?.age ?? null,
      height: profile?.height ?? null,
      weight: profile?.weight ?? null,
      gender: profile?.gender ?? null,
      goal: profile?.goal ?? null,
      activity: profile?.activity ?? null,
    },
    logs: waterEntries.map(e => ({
      date: new Date(e.created_at || '').toISOString(),
      amount_ml: e.amount || 0,
    })),
    summary: {
      total_ml: totalMl,
      avg_daily: avgDaily,
      streak,
      completion_rate: waterGoal ? Math.round((waterIntake / waterGoal) * 100) : 0,
      total_logs: waterEntries.length,
    },
  };

  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadBlob(url, 'digiwell-export.json');
}

export function exportToCSV(params: ExportParams, filename = 'digiwell-hydration-report.csv') {
  const { profile, waterIntake, waterGoal, streak, weeklyChartData, waterEntries, watchData } = params;

  const totalMl = waterEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const headers = ['Ngày', 'Lượng nước (ml)', 'Hoàn thành (%)', 'Nhịp tim', 'Số bước', 'Ghi chú'];
  const rows = weeklyChartData.map(day => {
    const pct = Math.round((day.ml / waterGoal) * 100);
    const note = day.ml >= waterGoal ? 'Đạt mục tiêu' : day.ml > 0 ? 'Chưa đạt' : 'Chưa uống';
    return [day.d, day.ml.toString(), pct.toString(), watchData?.heartRate?.toString() || '', watchData?.steps?.toString() || '', note].join(',');
  });

  const csvContent = [
    `BÁO CÁO ĐÁNH GIÁ ĐẦU NƯỚC - DigiWell`,
    `Họ tên: ${profile?.nickname || 'Khách'}`,
    `Tuổi: ${profile?.age ?? '--'} | Chiều cao: ${profile?.height ?? '--'} cm | Cân nặng: ${profile?.weight ?? '--'} kg`,
    `Giới tính: ${profile?.gender ?? '--'} | Mục tiêu: ${profile?.goal ?? '--'} | Vận động: ${profile?.activity ?? '--'}`,
    `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
    `Mục tiêu hằng ngày: ${waterGoal}ml`,
    `Uống hôm nay: ${waterIntake}ml`,
    `Chuỗi ngày uống: ${streak} ngày`,
    '',
    headers.join(','),
    ...rows,
    '',
    `Tổng số lần uống: ${waterEntries.length}`,
    `Tổng lượng nước: ${totalMl}ml`,
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  downloadBlob(url, filename);
}

export async function exportDetailedPDF(params: ExportParams) {
  const { profile, waterIntake, waterGoal, streak, weeklyChartData, waterEntries, avgWeekly, completionRate, isWatchConnected, watchData } = params;

  const todayLabel = new Date().toLocaleDateString('vi-VN');
  const totalEntries = waterEntries.length;
  const totalWater = waterEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const hasHealthData = !!(isWatchConnected && watchData);

  const html = buildReportHtml({
    profile, waterIntake, waterGoal, streak, todayLabel,
    totalEntries, totalWater, avgWeekly, completionRate,
    weeklyChartData, hasHealthData, watchData,
  });

  await iframePrint(html);
}

export function getExportDataURI(params: ExportParams): { json: string; csv: string } {
  const jsonBlob = new Blob([JSON.stringify(buildExportJSON(params), null, 2)], { type: 'application/json' });
  const csvContent = buildCSVContent(params);
  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  return {
    json: URL.createObjectURL(jsonBlob),
    csv: URL.createObjectURL(csvBlob),
  };
}

function buildExportJSON(params: ExportParams): ExportDataJSON {
  const { profile, waterIntake, waterGoal, streak, waterEntries } = params;
  const totalMl = waterEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const avgDaily = waterEntries.length > 0 ? Math.round(totalMl / waterEntries.length) : 0;

  return {
    exportedAt: new Date().toISOString(),
    app: 'DigiWell',
    version: 1,
    profile: {
      nickname: profile?.nickname ?? null,
      age: profile?.age ?? null,
      height: profile?.height ?? null,
      weight: profile?.weight ?? null,
      gender: profile?.gender ?? null,
      goal: profile?.goal ?? null,
      activity: profile?.activity ?? null,
    },
    logs: waterEntries.map(e => ({
      date: new Date(e.created_at || '').toISOString(),
      amount_ml: e.amount || 0,
    })),
    summary: {
      total_ml: totalMl,
      avg_daily: avgDaily,
      streak,
      completion_rate: waterGoal ? Math.round((waterIntake / waterGoal) * 100) : 0,
      total_logs: waterEntries.length,
    },
  };
}

function buildCSVContent(params: ExportParams): string {
  const { profile, waterIntake, waterGoal, streak, weeklyChartData, waterEntries, watchData } = params;
  const totalMl = waterEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const headers = ['Ngày', 'Lượng nước (ml)', 'Hoàn thành (%)', 'Nhịp tim', 'Số bước', 'Ghi chú'];
  const rows = weeklyChartData.map(day => {
    const pct = Math.round((day.ml / waterGoal) * 100);
    const note = day.ml >= waterGoal ? 'Đạt mục tiêu' : day.ml > 0 ? 'Chưa đạt' : 'Chưa uống';
    return [day.d, day.ml.toString(), pct.toString(), watchData?.heartRate?.toString() || '', watchData?.steps?.toString() || '', note].join(',');
  });

  return [
    `BÁO CÁO ĐÁNH GIÁ ĐẦU NƯỚC - DigiWell`,
    `Họ tên: ${profile?.nickname || 'Khách'}`,
    `Tuổi: ${profile?.age ?? '--'} | Chiều cao: ${profile?.height ?? '--'} cm | Cân nặng: ${profile?.weight ?? '--'} kg`,
    `Giới tính: ${profile?.gender ?? '--'} | Mục tiêu: ${profile?.goal ?? '--'} | Vận động: ${profile?.activity ?? '--'}`,
    `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
    `Mục tiêu hằng ngày: ${waterGoal}ml`,
    `Uống hôm nay: ${waterIntake}ml`,
    `Chuỗi ngày uống: ${streak} ngày`,
    '',
    headers.join(','),
    ...rows,
    '',
    `Tổng số lần uống: ${waterEntries.length}`,
    `Tổng lượng nước: ${totalMl}ml`,
  ].join('\n');
}

function buildReportHtml(opts: {
  profile: Profile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  todayLabel: string;
  totalEntries: number;
  totalWater: number;
  avgWeekly?: number;
  completionRate?: number;
  weeklyChartData: { d: string; ml: number }[];
  hasHealthData: boolean;
  watchData?: { heartRate?: number; steps?: number } | null;
}) {
  const { profile, waterIntake, waterGoal, streak, todayLabel, totalEntries, totalWater, avgWeekly, completionRate, weeklyChartData, hasHealthData, watchData } = opts;

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DigiWell Report</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #ffffff;
    }
    .report { padding: 24px; }
    h1 { margin: 0 0 6px; font-size: 28px; text-align: center; color: #0ea5e9; }
    .subtitle { margin: 0 0 20px; text-align: center; color: #64748b; font-size: 13px; }
    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0; }
    h2 { margin: 28px 0 10px; font-size: 18px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    th { background: #f1f5f9; font-weight: bold; color: #0f172a; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; font-style: italic; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
    .metric-card { padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #0f172a; }
    .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    ul { margin: 0; padding-left: 20px; line-height: 1.8; }
    li { margin-bottom: 4px; font-size: 13px; }
  </style>
</head>
<body>
  <main class="report">
    <h1>BÁO CÁO SỨC KHỎE DIGIWELL</h1>
    <p class="subtitle">Ngày xuất: ${sanitizeHtml(todayLabel)} - Thu thập bởi DigiCoach AI</p>
    <hr />

    <h2>1. Thông tin cá nhân</h2>
    <div class="metric-grid">
      <div class="metric-card">
        <p class="metric-label">Họ và tên</p>
        <p class="metric-value">${profile?.nickname ? sanitizeHtml(profile.nickname) : 'Khách'}</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">Tuổi</p>
        <p class="metric-value">${sanitizeHtml(String(profile?.age ?? '--'))}</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">Chiều cao</p>
        <p class="metric-value">${sanitizeHtml(String(profile?.height ?? '--'))} cm</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">Cân nặng</p>
        <p class="metric-value">${sanitizeHtml(String(profile?.weight ?? '--'))} kg</p>
      </div>
    </div>

    <h2>2. Thống kê nước hôm nay</h2>
    <div class="metric-grid">
      <div class="metric-card">
        <p class="metric-label">Đã uống</p>
        <p class="metric-value">${waterIntake} / ${waterGoal} ml</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">Tỉ lệ hoàn thành</p>
        <p class="metric-value">${completionRate ?? Math.round((waterIntake / waterGoal) * 100)}%</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">Trung bình tuần</p>
        <p class="metric-value">${avgWeekly ?? 0} ml</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">Chuỗi hiện tại</p>
        <p class="metric-value">${streak} ngày</p>
      </div>
    </div>

    <h2>3. Nhịp sinh học và hoạt động</h2>
    <ul>
      <li><strong>Mức độ vận động:</strong> ${sanitizeHtml(profile?.activity ?? '--')}</li>
      <li><strong>Nhịp tim gần nhất:</strong> ${hasHealthData ? `${watchData?.heartRate ?? '--'} BPM` : 'Chưa đồng bộ'}</li>
      <li><strong>Số bước chân:</strong> ${hasHealthData ? (watchData?.steps?.toString() ?? '--') : 'Chưa đồng bộ'}</li>
    </ul>

    <h2>4. Chi tiết ghi nhận trong tuần</h2>
    <table>
      <thead>
        <tr>
          <th>Ngày</th>
          <th>Lượng nước (ml)</th>
          <th>Tỉ lệ (%)</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        ${weeklyChartData.map(d => {
          const pct = Math.round((d.ml / waterGoal) * 100);
          const status = d.ml >= waterGoal ? 'Đạt mục tiêu' : d.ml > 0 ? 'Chưa đạt' : 'Chưa uống';
          return `<tr><td>${sanitizeHtml(d.d)}</td><td>${sanitizeHtml(String(d.ml))}</td><td>${pct}%</td><td>${sanitizeHtml(status)}</td></tr>`;
        }).join('')}
      </tbody>
    </table>

    <h2>5. Tổng hợp</h2>
    <ul>
      <li><strong>Tổng số lần uống:</strong> ${totalEntries}</li>
      <li><strong>Tổng lượng nước:</strong> ${totalWater} ml</li>
      <li><strong>Mục tiêu sức khỏe:</strong> ${sanitizeHtml(profile?.goal ?? '--')}</li>
      <li><strong>Mức độ hoạt động:</strong> ${sanitizeHtml(profile?.activity ?? '--')}</li>
    </ul>

    <p class="footer">Tài liệu này được tạo tự động. Không dùng để thay thế chẩn đoán y tế chuyên sâu.</p>
  </main>
</body>
</html>`;
}

async function iframePrint(html: string): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(fallbackTimer);
      iframe.onload = null;
      setTimeout(() => iframe.remove(), 1000);
    };

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };

    const fallbackTimer = window.setTimeout(() => {
      finish(new Error('Không thể mở chế độ in PDF lúc này.'));
    }, 15000);

    iframe.onload = () => {
      const printWindow = iframe.contentWindow;
      if (!printWindow) {
        finish(new Error('Không thể tạo cửa sổ in.'));
        return;
      }

      const finalizeAfterPrint = () => finish();
      printWindow.onafterprint = finalizeAfterPrint;

      window.setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
          window.setTimeout(() => finish(), 1500);
        } catch {
          finish(new Error('Không thể khởi động trình in.'));
        }
      }, 300);
    };

    document.body.appendChild(iframe);

    try {
      const doc = iframe.contentDocument;
      if (!doc) {
        finish(new Error('Không thể tạo tài liệu để in.'));
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();
    } catch {
      finish(new Error('Không thể tạo tài liệu để in.'));
    }
  });
}

function downloadBlob(url: string, filename: string) {
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
