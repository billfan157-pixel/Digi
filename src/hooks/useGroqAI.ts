import { useState, useCallback, useEffect, useRef } from 'react';
import i18n from '@/i18n';
import { toast } from 'sonner';
import { useUIStore } from '@/store/useUIStore';
import { 
  generateHydrationAdvice, 
  sendAiChatMessage, 
  streamAiChatMessage,
  fetchChatHistory,
  invokeAgenticWorkflow,
  type AiChatMessage, 
  type DigiwellAiContext,
  type AiAdviceResponse,
  type AgenticAction,
} from '../lib/ai';
import { getOfflineAdvice, type ExpertContext } from '../lib/offlineExpertSystem';
import { useBehaviorAnalysis } from './useBehaviorAnalysis';
import { supabase } from '../lib/supabase';
import type { WaterLog } from '../models';

/** Module-level Set để tránh double-trigger agentic khi React StrictMode double-mount */
const triggeredAgenticProfiles = new Set<string>();

export interface UseGroqAIProps {
  profile: { id?: string; nickname?: string; goal?: string; activity?: string; climate?: string } | null;
  waterIntake: number;
  waterGoal: number;
  streak?: number;
  sleepHours?: number;
  waterEntries?: WaterLog[];
  weeklyHistory?: Array<{ d: string; ml: number }>;
  calendarEvents?: Array<{ title: string; startRaw: string; endRaw: string }>;
  weatherData: { temp?: number; status?: string; location?: string } | null;
  watchData: { heartRate?: number; steps?: number } | null;
  isWeatherSynced: boolean;
  isWatchConnected: boolean;
  handleAddWater: (amount: number, factor: number, name: string) => Promise<void>;
  setShowAiChat?: (show: boolean) => void;
  handleExportPDF?: () => void;
  toggleFastingMode?: () => void;
  setShowHistory?: (show: boolean) => void;
}

/** Anonymize calendar titles → generic categories before sending to AI */
function categorizeCalendarTitle(title: string): string {
  const t = title.toLowerCase();
  if (/\b(họp|meeting|standup|sync|review|sprint|retro|planning)\b/.test(t)) return 'Lịch họp/Công việc';
  if (/\b(bác sĩ|doctor|khám|y tế|hospital|clinic|thuốc|health|therapy)\b/.test(t)) return 'Hẹn y tế/Sức khỏe';
  if (/\b(gym|tập|workout|run|chạy|yoga|swim|bơi|sport|thể thao|exercise)\b/.test(t)) return 'Tập luyện/Thể thao';
  if (/\b(ăn|lunch|dinner|breakfast|café|coffee|nhậu|tiệc|party)\b/.test(t)) return 'Bữa ăn/Gặp gỡ';
  if (/\b(học|class|course|lecture|study|exam|thi|trường)\b/.test(t)) return 'Học tập';
  if (/\b(đi|travel|bay|flight|trip|du lịch)\b/.test(t)) return 'Di chuyển/Du lịch';
  if (/\b(ngủ|sleep|nghỉ|break|rest)\b/.test(t)) return 'Nghỉ ngơi';
  return 'Sự kiện cá nhân';
}

function buildContextHash(p: UseGroqAIProps): string {
  // Include event titles (first 30 chars each) để invalidate khi calendar thay đổi
  const calHash = (p.calendarEvents ?? [])
    .slice(0, 10)
    .map(ev => `${categorizeCalendarTitle(ev.title ?? '')}|${ev.startRaw}`)
    .join('::');
  return [
    p.waterIntake.toFixed(0),
    p.waterGoal,
    p.calendarEvents?.length ?? 0,
    calHash,
    p.weeklyHistory?.reduce((s, d) => s + d.ml, 0) ?? 0,
    p.weatherData?.temp ?? 0,
    p.isWeatherSynced ? 1 : 0,
    p.isWatchConnected ? 1 : 0,
  ].join('|');
}

const defaultWelcomeMessage: AiChatMessage = {
  role: 'model',
  content: 'Chào đệ! Hôm nay DigiCoach đã sẵn sàng đồng hành cùng đệ. Hãy bắt đầu bằng cách uống một ly nước nhé!'
};

export type ChatWaterAction = {
  amount: number;
  factor: number;
  name: string;
};

export function useGroqAI(props: UseGroqAIProps) {
  const profile = props.profile;

  const propsRef = useRef(props);
  useEffect(() => { propsRef.current = props; });

  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedHistoryRef = useRef(false);

  // --- [1] STATES ---
  const [aiResponse, setAiResponse] = useState<AiAdviceResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([defaultWelcomeMessage]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [agenticSuggestions, setAgenticSuggestions] = useState<AgenticAction[]>([]);
  const isFetchingAdviceRef = useRef(false);
  const isChattingRef = useRef(false);
  const hasFetchedInitialAdvice = useRef(false);

  // --- [1.5] AI DAILY LIMIT CHECK ---
  const checkAILimit = useCallback(async (action: 'chat' | 'advice'): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('consume_ai_usage', { p_action: action });
      if (error) {
        console.error('[AI Limit] RPC error:', error);
        return true; // fail-open on RPC error
      }
      if (data && !data.allowed) {
        toast.warning(
          action === 'chat'
            ? i18n.t('ai.limit_chat')
            : i18n.t('ai.limit_advice'),
          { duration: 4000 }
        );
        useUIStore.getState().setShowPremiumModal(true);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[AI Limit] Unexpected error:', e);
      return true; // fail-open
    }
  }, []);
  const cacheHashRef = useRef('');

  // Behavior patterns from weekly data (for personalised AI context)
  const { patterns } = useBehaviorAnalysis({
    weeklyData: props.weeklyHistory || [],
    waterGoal: props.waterGoal,
  });
  const patternsRef = useRef(patterns);
  useEffect(() => { patternsRef.current = patterns; }, [patterns]);

  // Reset + load history khi profile thay đổi
  useEffect(() => {
    if (!profile?.id) {
      setChatMessages([defaultWelcomeMessage]);
      setAiResponse(null);
      hasFetchedInitialAdvice.current = false;
      hasLoadedHistoryRef.current = false;
      return;
    }
    if (hasLoadedHistoryRef.current) return;
    hasLoadedHistoryRef.current = true;

    fetchChatHistory(profile.id).then((messages) => {
      if (messages.length > 0) {
        setChatMessages(messages);
      }
    });
  }, [profile?.id]);

  // --- [2] BUILD CONTEXT ---
  const buildContext = useCallback((): DigiwellAiContext => {
    const p = propsRef.current;
    const currentPatterns = patternsRef.current;
    return {
      nowIso: new Date().toISOString(),
      waterIntake: p.waterIntake,
      waterGoal: p.waterGoal,
      hydrationHistory: p.weeklyHistory?.slice(-14).map(day => ({
        date: day.d,
        ml: day.ml,
      })),
      weather: (p.isWeatherSynced && p.weatherData) ? { 
        temp: p.weatherData.temp ?? 0, 
        status: p.weatherData.status || '', 
        location: '' 
      } : undefined,
      watch: (p.isWatchConnected && p.watchData) ? {
        heartRate: p.watchData.heartRate ?? 0,
        steps: p.watchData.steps ?? 0
      } : undefined,
      profile: p.profile ? {
        nickname: 'Thành viên',
        goal: p.profile.goal,
        activity: p.profile.activity,
        climate: p.profile.climate
      } : undefined,
      behaviorPatterns: currentPatterns.length > 0
        ? currentPatterns.map(pt => ({
            pattern: pt.pattern,
            confidence: pt.confidence,
            recommendation: pt.recommendation,
          }))
        : undefined,
      calendarEvents: p.calendarEvents?.length
        ? p.calendarEvents.slice(0, 10).map(ev => ({
            title: categorizeCalendarTitle(ev.title),
            startRaw: ev.startRaw,
            endRaw: ev.endRaw,
          }))
        : undefined,
    };
  }, []);

  // --- [3] ACTIONS ---

  const buildChatContext = useCallback((): DigiwellAiContext => {
    const recentHistory = chatMessages
      .slice(-8)
      .filter((msg) => msg.content.trim().length > 0)
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content.slice(0, 600),
      }));

    return {
      ...buildContext(),
      chatHistory: recentHistory,
    };
  }, [buildContext, chatMessages]);

  const updateLastModelMessage = useCallback((updater: (content: string) => string) => {
    setChatMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].role === 'model') {
          next[i] = { ...next[i], content: updater(next[i].content) };
          break;
        }
      }
      return next;
    });
  }, []);

  const handleWaterAction = useCallback(async (waterAction?: ChatWaterAction) => {
    const p = propsRef.current;
    if (!waterAction || !p.handleAddWater) return;

    // Runtime validation — defense-in-depth, mirrors server clampWaterAction
    const amount = Math.round(Number(waterAction.amount));
    const factor = Number(waterAction.factor);
    const name = typeof waterAction.name === 'string' ? waterAction.name.trim() : '';

    if (
      !Number.isFinite(amount) || amount < 30 || amount > 2000 ||
      !Number.isFinite(factor) || factor < -1 || factor > 1.5 ||
      name === ''
    ) {
      console.warn('[useGroqAI] Invalid waterAction rejected:', waterAction);
      return;
    }

    // Require user confirmation before executing AI water action
    const confirmed = window.confirm(
      `AI đề xuất ghi nhận ${amount}ml ${name}. Bạn có muốn xác nhận không?`
    );

    if (!confirmed) {
      toast.info(i18n.t('ai.cancelled'));
      return;
    }

    await p.handleAddWater(amount, factor, name);
    toast.success(i18n.t('water.recorded_with_name', { amount, name }));
  }, []);

  const handleReplyActions = useCallback((reply: string) => {
    const p = propsRef.current;
    const lowerReply = reply.toLowerCase();
    const shouldTriggerAction = (keywords: string[]) => keywords.some(kw => lowerReply.includes(kw));

    if (shouldTriggerAction(['báo cáo', 'xuất pdf', 'tạo file']) && p.handleExportPDF) {
      p.setShowAiChat?.(false);
      setTimeout(p.handleExportPDF, 500);
    }
    else if (shouldTriggerAction(['lịch sử', 'uống khi nào', 'xem lại']) && p.setShowHistory) {
      p.setShowAiChat?.(false);
      p.setShowHistory?.(true);
    }
    else if (shouldTriggerAction(['nhịn ăn', 'fasting', 'giờ ăn']) && p.toggleFastingMode) {
      p.setShowAiChat?.(false);
      p.toggleFastingMode?.();
    }
  }, []);


  /** Build ExpertContext for offline rule engine from current props */
  const buildExpertContext = useCallback((): ExpertContext => {
    const p = propsRef.current;
    const now = new Date();

    // Compute weekly avg completion from history
    let weeklyAvgCompletion: number | undefined;
    if (p.weeklyHistory && p.weeklyHistory.length > 0) {
      const totalDays = p.weeklyHistory.length;
      const achieved = p.weeklyHistory.filter(d => d.ml >= p.waterGoal).length;
      weeklyAvgCompletion = totalDays > 0 ? achieved / totalDays : undefined;
    }

    // Compute minutes since last drink from water entries
    let minutesSinceLastDrink: number | undefined;
    if (p.waterEntries && p.waterEntries.length > 0) {
      const lastEntry = p.waterEntries[0];
      const lastTime = new Date(lastEntry.created_at || lastEntry.day).getTime();
      if (!Number.isNaN(lastTime)) {
        minutesSinceLastDrink = Math.round((now.getTime() - lastTime) / 60000);
      }
    }

    return {
      waterToday: p.waterIntake,
      waterGoal: p.waterGoal,
      streak: p.streak ?? 0,
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      weather: p.weatherData?.temp != null ? { temp: p.weatherData.temp, humidity: 65 } : undefined,
      sleepHours: p.sleepHours,
      activityLevel: p.profile?.activity,
      weeklyAvgCompletion,
      minutesSinceLastDrink,
    };
  }, []);

  const fetchAIAdvice = useCallback(async () => {
    const profileId = propsRef.current.profile?.id;
    if (!profileId) return;

    // Enforce daily AI advice limit
    const allowed = await checkAILimit('advice');
    if (!allowed) return;
    
    if (isFetchingAdviceRef.current || isAiLoading) return;

    isFetchingAdviceRef.current = true;
    setIsAiLoading(true);
    
    try {
      // [Offline check] Nếu thiết bị mất kết nối mạng → dùng Offline Expert System ngay
      if (!navigator.onLine) {
        const expertAdvice = getOfflineAdvice(buildExpertContext());
        setAiResponse({ text: expertAdvice.text, suggestedAmount: expertAdvice.suggestedAmount });
        return;
      }

      const response = await generateHydrationAdvice(buildContext());
      setAiResponse(response);

      const ctxHash = buildContextHash(propsRef.current);
      cacheHashRef.current = ctxHash;
      localStorage.setItem(`digiwell_ai_advice_v2_${profileId}`, JSON.stringify({ response, timestamp: Date.now(), ctxHash }));
    } catch (error: unknown) {
      // [Try-Catch Fallback] API thất bại (timeout, mạng lag, rate limit) → fallback sang Offline Expert System
      console.warn('[useGroqAI] API advice failed, falling back to offline expert:', error);
      const expertAdvice = getOfflineAdvice(buildExpertContext());
      setAiResponse({ text: expertAdvice.text, suggestedAmount: expertAdvice.suggestedAmount });
    } finally {
      setIsAiLoading(false);
      isFetchingAdviceRef.current = false;
    }
  }, [buildContext, buildExpertContext, isAiLoading, checkAILimit]);

  useEffect(() => {
    if (!profile?.id || hasFetchedInitialAdvice.current) return;
    hasFetchedInitialAdvice.current = true;

    const cacheKey = `digiwell_ai_advice_v2_${profile.id}`;
    const currentHash = buildContextHash(propsRef.current);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { response, timestamp, ctxHash } = JSON.parse(cached);
        // Cache 30 phút — calendar events có thể thay đổi trong ngày
        if (Date.now() - timestamp < 30 * 60 * 1000 && ctxHash === currentHash) {
          setAiResponse(response);
          cacheHashRef.current = ctxHash;
          return;
        }
      } catch (e) { console.error(e); }
    }

    void fetchAIAdvice();
  }, [fetchAIAdvice, profile?.id]);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading || isChattingRef.current) return;

    // Enforce daily AI chat limit
    const allowed = await checkAILimit('chat');
    if (!allowed) return;

    // Hủy stream cũ nếu có
    abortRef.current?.abort();

    isChattingRef.current = true;
    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      const chatContext = buildChatContext();
      let streamedReply = '';
      let streamedWaterAction: ChatWaterAction | undefined;

      setChatMessages((prev) => [...prev, { role: 'model', content: '' }]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamAiChatMessage(userText, chatContext, (event) => {
          if (event.type === 'delta') {
            streamedReply += event.text;
            updateLastModelMessage((content) => content + event.text);
          } else if (event.type === 'waterAction') {
            streamedWaterAction = event.waterAction as ChatWaterAction;
          } else if (event.type === 'error') {
            throw new Error(event.error);
          }
        }, controller.signal);
      } catch (err: unknown) {
        const errStr = String(err instanceof Error ? err.message : err || '');
        if (errStr.includes('429') || errStr.toLowerCase().includes('limit') || errStr.toLowerCase().includes('rate limit')) {
          useUIStore.getState().setShowPremiumModal(true);
          throw err;
        }
        const { reply, waterAction } = await sendAiChatMessage(userText, chatContext);
        if (reply.includes('429') || reply.toLowerCase().includes('limit') || reply.toLowerCase().includes('rate limit')) {
          useUIStore.getState().setShowPremiumModal(true);
        }
        streamedReply = reply;
        streamedWaterAction = waterAction;
        updateLastModelMessage(() => reply);
      }

      const finalReply = streamedReply.trim();
      if (!finalReply) {
        updateLastModelMessage(() => 'Mình chưa hiểu ý bạn, bạn thử hỏi lại nhé.');
      }

      await handleWaterAction(streamedWaterAction);
      handleReplyActions(finalReply);
    } catch (error: unknown) {
      toast.error(i18n.t('ai.busy'));
      updateLastModelMessage(() => 'AI đang bận một chút, bạn thử lại sau nhé.');
      const errorMsg = String(error instanceof Error ? error.message : error || '');
      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('limit') || errorMsg.toLowerCase().includes('rate limit')) {
        useUIStore.getState().setShowPremiumModal(true);
      }
    } finally {
      abortRef.current = null;
      setIsChatLoading(false);
      setTimeout(() => { isChattingRef.current = false; }, 1000);
    }
  };

  const fetchAgenticSuggestions = useCallback(async () => {
    const profileId = propsRef.current.profile?.id;
    if (!profileId || !navigator.onLine) return;
    try {
      const actions = await invokeAgenticWorkflow(buildContext());
      setAgenticSuggestions(actions);
    } catch (error) {
      console.warn('[useGroqAI] Agentic workflow failed:', error);
    }
  }, [buildContext]);

  // Auto-trigger agentic 1 lần mỗi profile (module-level Set survive StrictMode double-mount, ref thì không)
  useEffect(() => {
    if (!profile?.id) return;
    if (triggeredAgenticProfiles.has(profile.id)) return;
    triggeredAgenticProfiles.add(profile.id);
    void fetchAgenticSuggestions();
  }, [profile?.id, fetchAgenticSuggestions]);

  return {
    aiAdvice: aiResponse?.text || '',
    isAiLoading, 
    chatMessages, 
    setChatMessages,
    isChatLoading, 
    chatInput, 
    setChatInput, 
    fetchAIAdvice, 
    handleSendChatMessage,
    agenticSuggestions,
    fetchAgenticSuggestions,
  };
}
