import type { Profile } from '@/models';

const escapeHtml = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );

interface ExportData {
  profile: Profile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  weeklyChartData: { d: string; ml: number }[];
  waterEntries: Record<string, unknown>[];
}

export function exportToCSV(data: ExportData, filename: string = 'digifile-hydration-report.csv') {
  const { profile, waterIntake, waterGoal, streak, weeklyChartData, waterEntries } = data;
  
  const headers = ['Ngày', 'Lượng nước (ml)', 'Hoàn thành (%)', 'Ghi chú'];
  const rows: string[] = [];
  
  weeklyChartData.forEach(day => {
    const pct = Math.round((day.ml / waterGoal) * 100);
    const note = day.ml >= waterGoal ? 'Đạt mục tiêu' : day.ml > 0 ? 'Chưa đạt' : 'Chưa uống';
    rows.push([day.d, day.ml.toString(), pct.toString(), note].join(','));
  });
  
  const csvContent = [
    `BÁO CÁO ĐÁNH GIÁ ĐẦU NƯỚC - DigiWell`,
    `Họ tên: ${profile?.nickname || 'Khách'}`,
    `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
    `Mục tiêu hằng ngày: ${waterGoal}ml`,
    `Uống hôm nay: ${waterIntake}ml`,
    `Chuỗi ngày uống: ${streak} ngày`,
    '',
    headers.join(','),
    ...rows,
    '',
    `Tổng số lần uống: ${waterEntries.length}`,
    `Tổng lượng nước: ${waterEntries.reduce((s: number, e: { amount?: number }) => s + (e.amount || 0), 0)}ml`
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportDetailedPDF(params: {
  profile: Profile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  weeklyChartData: { d: string; ml: number }[];
  waterEntries: Record<string, unknown>[];
  avgWeekly: number;
  completionRate: number;
}) {
  const { profile, waterIntake, waterGoal, streak, weeklyChartData, waterEntries, avgWeekly, completionRate } = params;
  
  const todayLabel = new Date().toLocaleDateString('vi-VN');
  const totalEntries = waterEntries.length;
  const totalWater = waterEntries.reduce((s: number, e: { amount?: number }) => s + (e.amount || 0), 0);
  
  const html = `<!doctype html>
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
      .report {
        padding: 24px;
      }
      h1 {
        margin: 0 0 6px;
        font-size: 28px;
        text-align: center;
        color: #0ea5e9;
      }
      .subtitle {
        margin: 0 0 20px;
        text-align: center;
        color: #64748b;
        font-size: 13px;
      }
      hr {
        border: 0;
        border-top: 1px solid #e2e8f0;
        margin: 20px 0;
      }
      h2 {
        margin: 28px 0 10px;
        font-size: 18px;
        color: #0f172a;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
      }
      th, td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }
      th {
        background: #f1f5f9;
        font-weight: bold;
        color: #0f172a;
      }
      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 12px;
        color: #94a3b8;
        font-style: italic;
      }
      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin: 16px 0;
      }
      .metric-card {
        padding: 12px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #0f172a;
      }
      .metric-label {
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <main class="report">
      <h1>BAO CAO SUC KHOE DIGIWELL</h1>
      <p class="subtitle">Ngay xuat: ${escapeHtml(todayLabel)} - Thu thap boi DigiCoach AI</p>
      <hr />
      
      <h2>1. Thong tin ca nhan</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <p class="metric-label">Ho va ten</p>
          <p class="metric-value">${profile?.nickname ? escapeHtml(profile.nickname) : 'Khach'}</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Tuoi</p>
          <p class="metric-value">${escapeHtml(profile?.age ?? '--')}</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Chieu cao</p>
          <p class="metric-value">${escapeHtml(profile?.height ?? '--')} cm</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Can nang</p>
          <p class="metric-value">${escapeHtml(profile?.weight ?? '--')} kg</p>
        </div>
      </div>

      <h2>2. Thong ke nuoc hom nay</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <p class="metric-label">Da uong</p>
          <p class="metric-value">${waterIntake} / ${waterGoal} ml</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Ti le hoan thanh</p>
          <p class="metric-value">${completionRate}%</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Trung binh tuan</p>
          <p class="metric-value">${avgWeekly} ml</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Chuoi hien tai</p>
          <p class="metric-value">${streak} ngay</p>
        </div>
      </div>

      <h2>3. Chi tiet ghi nhan trong tuan</h2>
      <table>
        <thead>
          <tr>
            <th>Ngay</th>
            <th>Luong nuoc (ml)</th>
            <th>Ti le (%)</th>
            <th>Trang thai</th>
          </tr>
        </thead>
        <tbody>
          ${weeklyChartData.map(d => {
            const pct = Math.round((d.ml / waterGoal) * 100);
            const status = d.ml >= waterGoal ? 'Dat muc tieu' : d.ml > 0 ? 'Chua dat' : 'Chua uong';
            return `<tr><td>${escapeHtml(d.d)}</td><td>${escapeHtml(d.ml)}</td><td>${pct}%</td><td>${escapeHtml(status)}</td></tr>`;
          }).join('')}
        </tbody>
      </table>

      <h2>4. Tong hop</h2>
      <ul>
        <li><strong>Tong so lan uong:</strong> ${totalEntries}</li>
        <li><strong>Tong luong nuoc:</strong> ${totalWater} ml</li>
        <li><strong>Muc tieu suc khoe:</strong> ${escapeHtml(profile?.goal ?? '--')}</li>
        <li><strong>Muc do hoat dong:</strong> ${escapeHtml(profile?.activity ?? '--')}</li>
      </ul>

      <p class="footer">Tai lieu nay duoc tao tu dong. Khong dung de thay the chan doan y te chuyen sau.</p>
    </main>
  </body>
</html>`;

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
      finish(new Error('Khong the mo che do in PDF luc nay.'));
    }, 15000);

    iframe.onload = () => {
      const printWindow = iframe.contentWindow;
      if (!printWindow) {
        finish(new Error('Khong the tao cua so in.'));
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
          finish(new Error('Khong the khoi dong trinh in.'));
        }
      }, 300);
    };

    document.body.appendChild(iframe);

    try {
      const doc = iframe.contentDocument;
      if (!doc) {
        finish(new Error('Khong the tao tai lieu de in.'));
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();
    } catch {
      finish(new Error('Khong the tao tai lieu de in.'));
    }
  });
}