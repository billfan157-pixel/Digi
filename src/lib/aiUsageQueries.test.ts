import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateEstimatedCosts, formatCostSummary, getCostDisclaimer } from './aiUsageQueries';

const mockFrom = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

describe('aiUsageQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDailyAIUsage', () => {
    it('queriessupabase with expected parameters', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ date: '2026-05-22', message_count: 10, advice_count: 5, scan_count: 2 }], error: null }),
      };
      mockFrom.mockReturnValue(mockQueryBuilder);

      const { getDailyAIUsage } = await import('./aiUsageQueries');
      const result = await getDailyAIUsage('test-user-id', 30);

      expect(mockFrom).toHaveBeenCalledWith('ai_usage');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(30);
      expect(result).toHaveLength(1);
      expect(result[0].message_count).toBe(10);
    });

    it('returns empty array on database error', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      mockFrom.mockReturnValue(mockQueryBuilder);

      const { getDailyAIUsage } = await import('./aiUsageQueries');
      const result = await getDailyAIUsage('test-user-id', 30);
      expect(result).toEqual([]);
    });
  });

  describe('calculateEstimatedCosts', () => {
    it('correctly calculates cumulative costs and breakdown', () => {
      const sampleUsage = [
        {
          date: '2026-05-22',
          message_count: 10, // 10 * 0.000001 = 0.000010
          advice_count: 2,  // 2 * 0.000019 = 0.000038
          scan_count: 1     // 1 * 0.000040 = 0.000040
          // Total USD = 0.000088
          // Total VND = 0.000088 * 25400 = 2.2352
        },
        {
          date: '2026-05-21',
          message_count: 0,
          advice_count: 0,
          scan_count: 0
        }
      ];

      const costs = calculateEstimatedCosts(sampleUsage);

      expect(costs.totalMessages).toBe(10);
      expect(costs.totalAdvice).toBe(2);
      expect(costs.totalScans).toBe(1);
      expect(costs.totalCostUSD).toBeCloseTo(0.000088, 6);
      expect(costs.totalCostVND).toBeCloseTo(0.000088 * 25400, 4);
      expect(costs.dailyBreakdown).toHaveLength(2);
      expect(costs.dailyBreakdown[0].date).toBe('2026-05-22');
      expect(costs.dailyBreakdown[0].costUSD).toBeCloseTo(0.000088, 6);
      expect(costs.dailyBreakdown[1].costUSD).toBe(0);
    });
  });

  describe('formatCostSummary', () => {
    it('formats summary message correctly', () => {
      const summary = formatCostSummary({
        totalMessages: 5,
        totalAdvice: 3,
        totalScans: 2,
        totalCostUSD: 0.000137,
        totalCostVND: 3.4798,
        dailyBreakdown: []
      });

      expect(summary.summary).toContain('$0.000137');
      expect(summary.details).toContain('5 tin nhắn');
      expect(summary.details).toContain('3 lời khuyên');
      expect(summary.details).toContain('2 quét thực phẩm');
    });
  });

  describe('getCostDisclaimer', () => {
    it('returns Vietnamese disclaimer text', () => {
      expect(getCostDisclaimer()).toBe('Chi phí ước tính dựa trên số lượng token trung bình (độ chính xác ±30%)');
    });
  });
});
