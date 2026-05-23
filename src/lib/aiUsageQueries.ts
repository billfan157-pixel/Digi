// AI Usage Queries with Corrected Cost Model (Sprint 1)
// Based on actual Groq pricing (May 2026)

import { supabase } from './supabase';

export interface DailyAIUsage {
  date: string;
  message_count: number;
  advice_count: number;
  scan_count: number;
}

export interface CostSummary {
  totalMessages: number;
  totalAdvice: number;
  totalScans: number;
  totalCostUSD: number;
  totalCostVND: number;
  dailyBreakdown: Array<{
    date: string;
    messages: number;
    advice: number;
    scans: number;
    costUSD: number;
    costVND: number;
  }>;
}

// Corrected cost rates based on actual Groq pricing (May 2026)
// Llama 3.1 8B: $0.05 per million input tokens
// Llama 3.3 70B: $0.59 input / $0.79 output per million tokens
const COST_RATES = {
  message: 0.000001, // $0.000001 per message (~0.025đ VND) - based on 20 tokens avg
  advice: 0.000019,  // $0.000019 per advice (~0.48đ VND) - based on 33 tokens avg
  scan: 0.000040    // $0.000040 per scan (~1.0đ VND) - based on 50 tokens avg
};

const EXCHANGE_RATE = 25400; // 1 USD = 25,400 VND

export async function getDailyAIUsage(userId: string, days: number = 30): Promise<DailyAIUsage[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateStr)
      .order('date', { ascending: false })
      .limit(days);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    return [];
  }
}

export function calculateEstimatedCosts(usageData: DailyAIUsage[]): CostSummary {
  let totalMessages = 0;
  let totalAdvice = 0;
  let totalScans = 0;
  let totalCostUSD = 0;

  const dailyBreakdown = usageData.map((day) => {
    const messageCost = day.message_count * COST_RATES.message;
    const adviceCost = day.advice_count * COST_RATES.advice;
    const scanCost = day.scan_count * COST_RATES.scan;
    const dayCostUSD = messageCost + adviceCost + scanCost;

    totalMessages += day.message_count;
    totalAdvice += day.advice_count;
    totalScans += day.scan_count;
    totalCostUSD += dayCostUSD;

    return {
      date: day.date,
      messages: day.message_count,
      advice: day.advice_count,
      scans: day.scan_count,
      costUSD: dayCostUSD,
      costVND: dayCostUSD * EXCHANGE_RATE
    };
  });

  return {
    totalMessages,
    totalAdvice,
    totalScans,
    totalCostUSD,
    totalCostVND: totalCostUSD * EXCHANGE_RATE,
    dailyBreakdown
  };
}

export function formatCostSummary(costs: CostSummary): {
  summary: string;
  details: string;
} {
  return {
    summary: `Tổng chi phí 30 ngày: $${costs.totalCostUSD.toFixed(6)} (~${costs.totalCostVND.toFixed(0)}đ VND)`,
    details: `${costs.totalMessages} tin nhắn, ${costs.totalAdvice} lời khuyên, ${costs.totalScans} quét thực phẩm`
  };
}

export function getCostDisclaimer(): string {
  return 'Chi phí ước tính dựa trên số lượng token trung bình (độ chính xác ±30%)';
}
