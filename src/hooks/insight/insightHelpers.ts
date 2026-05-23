import type { CalendarEventItem } from '../useCalendarSync';

export const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export function getLocalDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getBusyEvents(events: CalendarEventItem[], dateKey: string) {
  return events.filter(ev => {
    const startKey = ev.startRaw.length >= 10 ? ev.startRaw.slice(0, 10) : '';
    return !ev.isAllDay && startKey === dateKey && ev.transparency !== 'transparent';
  });
}

export function countBusyHours(events: CalendarEventItem[], dateKey: string) {
  return getBusyEvents(events, dateKey)
    .reduce((total, ev) => {
      const start = new Date(ev.startRaw).getTime();
      const end = new Date(ev.endRaw).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) return total;
      return total + (end - start) / (1000 * 60 * 60);
    }, 0);
}

export const RISK_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

export type EventCategory =
  | 'sleep' | 'meal' | 'exercise' | 'meeting'
  | 'school' | 'social' | 'medical' | 'travel'
  | 'entertainment' | 'work' | 'other';

export const CATEGORY_KEYWORDS: Record<Exclude<EventCategory, 'other'>, { vi: string; en: string }> = {
  sleep:        { vi: 'ngủ|nghỉ trưa|nap',                  en: 'sleep|nap|rest|break' },
  meal:         { vi: 'ăn|ăn trưa|ăn sáng|ăn tối|cơm|bữa',  en: 'lunch|dinner|breakfast|meal|eat|food|coffee|tea' },
  school:       { vi: 'học|lớp|bài|thi|ôn',                  en: 'class|lecture|study|lesson|course|exam|test' },
  exercise:     { vi: 'tập|gym|chạy|yoga|bơi|đạp|thể dục',  en: 'gym|workout|run|yoga|swim|bike|exercise|sport' },
  meeting:      { vi: 'họp|meeting|cocall|call|pitch',       en: 'meeting|call|sync|standup|review|interview' },
  social:       { vi: 'đi chơi|hẹn|date|party|nhậu|gặp',     en: 'date|party|hangout|dinner|drinks|friend' },
  medical:      { vi: 'khám|bác sĩ|bệnh|tái khám|chích',     en: 'doctor|hospital|clinic|appointment|checkup|medical|dentist' },
  travel:       { vi: 'đi|bay|máy bay|tàu|xe khách|lái',     en: 'travel|flight|drive|commute|trip|journey' },
  entertainment:{ vi: 'phim|cinema|rạp|concert|game|show',    en: 'movie|cinema|concert|game|theater|show' },
  work:         { vi: 'làm việc|work|project|sprint|task',    en: 'work|task|project|sprint|deadline|office' },
};

export function sanitizeCalendarTitle(title: string): string {
  if (!title) return '';
  const sanitized = title
    .replace(/[${}<>]/g, '') // Remove template literal and tag chars
    // eslint-disable-next-line no-control-regex -- Intentionally removing control characters for security
    .replace(/[\u0000-\u001F\u007F]/g, '') // Remove control characters
    .trim();
  return sanitized.slice(0, 200);
}

export function classifyEvent(title: string): EventCategory {
  const sanitized = sanitizeCalendarTitle(title);
  const t = sanitized.toLowerCase();
  for (const [cat, kw] of Object.entries(CATEGORY_KEYWORDS)) {
    const pattern = `${kw.vi}|${kw.en}`;
    const parts = pattern.split('|');
    const matched = parts.some(part => {
      const escaped = part.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'ui');
      return regex.test(t);
    });
    if (matched) return cat as EventCategory;
  }
  return 'meeting';
}

const PII_PATTERNS = [
  /\b\d{10,11}\b/g, // Phone numbers
  /\b[A-ZĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]+\s+[A-ZĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]+\b/g, // Names (basic with Vietnamese support)
  /\b(anh|chị|em|bạn|bác|cô|chú|ông|bà|mr|ms|mrs)\s+[A-ZĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]+\b/gi, // Names with pronouns
  /\b\d+\s+[A-Za-zĐđàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]+\s+(Street|St|Avenue|Ave|Road|Rd|Đường|Phố|Ngõ|Ngách)/gi, // Addresses
];

export function anonymizeTitle(title: string, privacyLevel: 'strict' | 'standard' | 'off' = 'standard'): string {
  const sanitized = sanitizeCalendarTitle(title);
  if (privacyLevel === 'off') {
    return sanitized;
  }
  
  if (privacyLevel === 'strict') {
    const category = classifyEvent(sanitized);
    switch (category) {
      case 'sleep': return '[Lịch nghỉ ngơi]';
      case 'meal': return '[Lịch ăn uống]';
      case 'exercise': return '[Lịch tập luyện]';
      case 'school': return '[Lịch học tập]';
      case 'social': return '[Lịch hẹn]';
      case 'medical': return '[Lịch y tế]';
      case 'travel': return '[Lịch di chuyển]';
      case 'entertainment': return '[Lịch giải trí]';
      case 'work': return '[Lịch làm việc]';
      case 'meeting': return '[Lịch họp]';
      default: return '[Lịch trình]';
    }
  }
  
  // standard privacy
  let anonymized = sanitized;
  PII_PATTERNS.forEach(pattern => {
    anonymized = anonymized.replace(pattern, '[REDACTED]');
  });
  return anonymized;
}

export const CATEGORY_PROFILES: Record<EventCategory, {
  label: string;
  risk: 'low' | 'medium' | 'high';
  advice: string;
  extraMl: number;
}> = {
  sleep:   { label: 'giấc ngủ',   risk: 'low',    extraMl: 0,    advice: 'Uống 150ml nước ấm trước khi ngủ, tránh uống sát giờ để khỏi tiểu đêm.' },
  meal:    { label: 'bữa ăn',     risk: 'low',    extraMl: 0,    advice: 'Nhân tiện ăn, uống 200ml nước để hỗ trợ tiêu hóa.' },
  exercise:{ label: 'tập luyện',  risk: 'high',   extraMl: 400,  advice: 'Vận động ra nhiều mồ hôi, cần bù 400ml trước/sau buổi tập.' },
  meeting: { label: 'họp hành',   risk: 'high',   extraMl: 250,  advice: 'Mang chai nước vào phòng họp, uống từng ngụm giữa các phiên.' },
  school:  { label: 'học tập',    risk: 'medium', extraMl: 150,  advice: 'Để chai nước trên bàn học, uống đều đặn mỗi 30 phút.' },
  social:  { label: 'đi chơi',    risk: 'high',   extraMl: 300,  advice: 'Dễ uống bia/rượu thay vì nước. Xen kẽ 1 ly nước giữa các ly khác.' },
  medical: { label: 'y tế',       risk: 'medium', extraMl: 0,    advice: 'Nếu không có chỉ định nhịn ăn/uống, hãy uống 200ml trước khi đi.' },
  travel:  { label: 'di chuyển',  risk: 'high',   extraMl: 350,  advice: 'Mang theo bình nước khi di chuyển, uống thêm 350ml để bù.' },
  entertainment: { label: 'giải trí', risk: 'medium', extraMl: 200, advice: 'Phim/game dễ cuốn theo, đặt nhắc nhở uống nước mỗi 45 phút.' },
  work:    { label: 'làm việc',   risk: 'medium', extraMl: 200,  advice: 'Để nước trên bàn làm việc, tập thói quen uống mỗi khi chuyển task.' },
  other:   { label: 'lịch trình', risk: 'medium', extraMl: 150,  advice: 'Giữ chai nước bên cạnh, uống từng ngụm nhỏ đều đặn.' },
};

export function classifyEvents(events: CalendarEventItem[], dateKey: string, privacyLevel: 'strict' | 'standard' | 'off' = 'standard') {
  const busy = getBusyEvents(events, dateKey);
  return busy.map(ev => {
    const category = classifyEvent(ev.title);
    const anonTitle = anonymizeTitle(ev.title, privacyLevel);
    return {
      ...ev,
      title: anonTitle,
      category,
      profile: CATEGORY_PROFILES[category],
    };
  });
}

export function summarizeProfile(categorized: ReturnType<typeof classifyEvents>): {
  worstRisk: EventCategory;
  dominantLabel: string;
  totalExtraMl: number;
  adviceLines: string[];
  sampleName: string;
} {
  if (categorized.length === 0) {
    return { worstRisk: 'other', dominantLabel: 'khác', totalExtraMl: 0, adviceLines: [], sampleName: '' };
  }
  const byCat = new Map<EventCategory, { count: number; hours: number; names: string[] }>();
  for (const ev of categorized) {
    const cat = ev.category;
    const cur = byCat.get(cat) ?? { count: 0, hours: 0, names: [] };
    cur.count++;
    cur.names.push(ev.title);
    const start = new Date(ev.startRaw).getTime();
    const end = new Date(ev.endRaw).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      cur.hours += (end - start) / (1000 * 60 * 60);
    }
    byCat.set(cat, cur);
  }
  const entries = Array.from(byCat.entries()).sort((a, b) => b[1].hours - a[1].hours);
  const dominant = entries[0][0];
  const totalExtraMl = entries.reduce((s, [cat, info]) => {
    return s + CATEGORY_PROFILES[cat].extraMl * Math.max(1, Math.ceil(info.hours / 2));
  }, 0);
  const worstRisk = entries.reduce((worst, [cat]) => {
    return RISK_ORDER[CATEGORY_PROFILES[cat].risk] > RISK_ORDER[CATEGORY_PROFILES[worst].risk] ? cat : worst;
  }, dominant);
  const adviceLines = [...new Set(entries.map(([cat]) => CATEGORY_PROFILES[cat].advice))].slice(0, 2);
  const sampleName = categorized.find(e => e.title?.trim())?.title || '';
  return { worstRisk, dominantLabel: CATEGORY_PROFILES[dominant].label, totalExtraMl, adviceLines, sampleName };
}
