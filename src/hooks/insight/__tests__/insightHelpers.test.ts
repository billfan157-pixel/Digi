import { describe, it, expect } from 'vitest';
import { sanitizeCalendarTitle, classifyEvent, anonymizeTitle, classifyEvents } from '../insightHelpers';
import type { CalendarEventItem } from '../../useCalendarSync';

describe('insightHelpers - Input Sanitization & PII Anonymization', () => {
  describe('sanitizeCalendarTitle', () => {
    it('should return empty string if input is empty', () => {
      expect(sanitizeCalendarTitle('')).toBe('');
    });

    it('should remove dangerous characters like template literal syntax', () => {
      expect(sanitizeCalendarTitle('Hello ${PII} <script>')).toBe('Hello PII script');
    });

    it('should remove control characters', () => {
      expect(sanitizeCalendarTitle('Hello\x00World\x1F')).toBe('HelloWorld');
    });

    it('should limit title length to 200 characters', () => {
      const longTitle = 'a'.repeat(300);
      expect(sanitizeCalendarTitle(longTitle).length).toBe(200);
    });
  });

  describe('anonymizeTitle', () => {
    const piiTitle = 'Họp với Nguyễn Văn A gọi 0912345678 tại 123 Phố Huế';

    it('should return original sanitized title when privacy level is off', () => {
      expect(anonymizeTitle(piiTitle, 'off')).toBe('Họp với Nguyễn Văn A gọi 0912345678 tại 123 Phố Huế');
    });

    it('should redact phone numbers, names, and addresses when privacy level is standard', () => {
      const standardAnon = anonymizeTitle(piiTitle, 'standard');
      expect(standardAnon).toContain('[REDACTED]');
      expect(standardAnon).not.toContain('Nguyễn Văn A');
      expect(standardAnon).not.toContain('0912345678');
      expect(standardAnon).not.toContain('123 Phố Huế');
    });

    it('should replace entire title with category generic label when privacy level is strict', () => {
      // PiiTitle has "Họp" which triggers meeting category
      expect(anonymizeTitle(piiTitle, 'strict')).toBe('[Lịch họp]');
      
      expect(anonymizeTitle('Đi ăn trưa cùng gia đình', 'strict')).toBe('[Lịch ăn uống]');
      expect(anonymizeTitle('Tập Gym tại California', 'strict')).toBe('[Lịch tập luyện]');
      expect(anonymizeTitle('Lớp học Thể dục', 'strict')).toBe('[Lịch học tập]');
    });
  });

  describe('classifyEvent', () => {
    it('should classify keywords correctly', () => {
      expect(classifyEvent('Đi ngủ sớm')).toBe('sleep');
      expect(classifyEvent('Bữa cơm gia đình')).toBe('meal');
      expect(classifyEvent('Chạy bộ buổi sáng')).toBe('exercise');
      expect(classifyEvent('Họp sprint retrospective')).toBe('meeting');
      expect(classifyEvent('Thi học kỳ')).toBe('school');
      expect(classifyEvent('Đi nhậu cuối tuần')).toBe('social');
      expect(classifyEvent('Khám sức khỏe tổng quát')).toBe('medical');
      expect(classifyEvent('Bay đi Hà Nội')).toBe('travel');
      expect(classifyEvent('Chơi game lol')).toBe('entertainment');
      expect(classifyEvent('Làm việc dự án mới')).toBe('work');
      expect(classifyEvent('Một lịch trình bất kỳ')).toBe('meeting'); // default is meeting
    });
  });

  describe('classifyEvents', () => {
    const mockEvents: CalendarEventItem[] = [
      {
        id: '1',
        title: 'Tập Gym lúc 18h với anh Nam 0987654321',
        start: '18:00',
        end: '19:30',
        startRaw: '2026-05-22T18:00:00Z',
        endRaw: '2026-05-22T19:30:00Z',
        isAllDay: false,
      }
    ];

    it('should classify and anonymize events matching privacyLevel', () => {
      const result = classifyEvents(mockEvents, '2026-05-22', 'standard');
      expect(result[0].category).toBe('exercise');
      expect(result[0].title).not.toContain('anh Nam');
      expect(result[0].title).not.toContain('0987654321');
      expect(result[0].title).toContain('[REDACTED]');
    });

    it('should fully anonymize events when strict', () => {
      const result = classifyEvents(mockEvents, '2026-05-22', 'strict');
      expect(result[0].category).toBe('exercise');
      expect(result[0].title).toBe('[Lịch tập luyện]');
    });
  });
});
