import type { Profile } from '@/models';

type ExportHealthReportParams = {
  profile: Profile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  progress: number;
  isWatchConnected: boolean;
  watchData?: { heartRate?: number; steps?: number } | null;
};

function escapeHtml(text: string) {
  return String(text).replace(/[&<>"']/g, (match) => (
    {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[match] || match
  ));
}

function buildReportHtml({
  profile,
  waterIntake,
  waterGoal,
  streak,
  progress,
  isWatchConnected,
  watchData,
}: ExportHealthReportParams) {
  const todayLabel = new Date().toLocaleDateString('vi-VN');

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
      ul {
        margin: 0;
        padding-left: 20px;
        line-height: 1.8;
      }
      li {
        margin-bottom: 4px;
      }
      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 12px;
        color: #94a3b8;
        font-style: italic;
      }
    </style>
  </head>
  <body>
    <main class="report">
      <h1>BAO CAO SUC KHOE DIGIWELL</h1>
      <p class="subtitle">Ngay xuat: ${escapeHtml(todayLabel)} - Thu thap boi DigiCoach AI</p>
      <hr />
      <h2>1. Thong tin ca nhan</h2>
      <ul>
        <li><strong>Ho va ten:</strong> ${escapeHtml(profile?.nickname || 'Khach')}</li>
        <li><strong>The trang:</strong> ${escapeHtml(profile?.age?.toString() || '--')} tuoi, ${escapeHtml(profile?.height?.toString() || '--')} cm, ${escapeHtml(profile?.weight?.toString() || '--')} kg</li>
        <li><strong>Muc tieu suc khoe:</strong> ${escapeHtml(profile?.goal || '--')}</li>
      </ul>
      <h2>2. Thong ke nuoc hom nay</h2>
      <ul>
        <li><strong>Da uong:</strong> ${escapeHtml(waterIntake.toString())} ml / ${escapeHtml(waterGoal.toString())} ml (Hoan thanh ${escapeHtml(Math.round(progress).toString())}%)</li>
        <li><strong>Chuoi hien tai:</strong> ${escapeHtml(streak.toString())} ngay lien tiep</li>
      </ul>
      <h2>3. Nhip sinh hoc va hoat dong</h2>
      <ul>
        <li><strong>Muc do van dong:</strong> ${escapeHtml(profile?.activity || '--')}</li>
        <li><strong>Nhip tim gan nhat:</strong> ${escapeHtml(isWatchConnected ? `${watchData?.heartRate?.toString() ?? '--'} BPM` : 'Chua dong bo')}</li>
        <li><strong>So buoc chan:</strong> ${escapeHtml(isWatchConnected ? (watchData?.steps?.toString() ?? '--') : 'Chua dong bo')}</li>
      </ul>
      <p class="footer">Tai lieu nay duoc tao tu dong. Khong dung de thay the chan doan y te chuyen sau.</p>
    </main>
  </body>
</html>`;
}

export async function exportHealthReportPDF(params: ExportHealthReportParams) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  const html = buildReportHtml(params);

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
