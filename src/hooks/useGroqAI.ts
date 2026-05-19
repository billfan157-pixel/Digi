import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { 
  generateHydrationAdvice, 
  sendAiChatMessage, 
  streamAiChatMessage,
  type AiChatMessage, 
  type DigiwellAiContext,
  type AiAdviceResponse 
} from '../lib/ai';
import { useBehaviorAnalysis } from './useBehaviorAnalysis';

export interface UseGeminiAIProps {
  profile: { id?: string; nickname?: string; goal?: string; activity?: string; climate?: string } | null;
  waterIntake: number;
  waterGoal: number;
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

function buildContextHash(p: UseGeminiAIProps): string {
  // Include event titles (first 30 chars each) để invalidate khi calendar thay đổi
  const calHash = (p.calendarEvents ?? [])
    .slice(0, 10)
    .map(ev => `${ev.title?.slice(0, 30) ?? ''}|${ev.startRaw}`)
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

type ChatWaterAction = {
  amount: number;
  factor: number;
  name: string;
};

export function useGeminiAI(props: UseGeminiAIProps) {
  const profile = props.profile;

  // [BÍ QUYẾT TỐI ƯU] Dùng Ref để lưu trữ props mới nhất mà KHÔNG kích hoạt re-render
  const propsRef = useRef(props);
  useEffect(() => { propsRef.current = props; });

  // --- [1] STATES ---
  const [aiResponse, setAiResponse] = useState<AiAdviceResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([defaultWelcomeMessage]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const isFetchingAdviceRef = useRef(false);
  const isChattingRef = useRef(false);
  const hasFetchedInitialAdvice = useRef(false);
  const cacheHashRef = useRef('');

  // Behavior patterns from weekly data (for personalised AI context)
  const { patterns } = useBehaviorAnalysis({
    weeklyData: props.weeklyHistory || [],
    waterGoal: props.waterGoal,
  });
  const patternsRef = useRef(patterns);
  useEffect(() => { patternsRef.current = patterns; }, [patterns]);

  // Clean chat khi logout
  useEffect(() => {
    if (!profile?.id) {
      setChatMessages([defaultWelcomeMessage]);
      setAiResponse(null);
      hasFetchedInitialAdvice.current = false;
    }
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
        location: p.weatherData.location || '' 
      } : undefined,
      watch: (p.isWatchConnected && p.watchData) ? {
        heartRate: p.watchData.heartRate ?? 0,
        steps: p.watchData.steps ?? 0
      } : undefined,
      profile: p.profile ? {
        nickname: p.profile.nickname,
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
            title: ev.title,
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

    await p.handleAddWater(waterAction.amount, waterAction.factor, waterAction.name);
    toast.success(`Ghi nhận: ${waterAction.amount}ml ${waterAction.name}`);
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


  const fetchAIAdvice = useCallback(async () => {
    const profileId = propsRef.current.profile?.id;
    if (!profileId) return;
    
    if (isFetchingAdviceRef.current || isAiLoading) return;

    isFetchingAdviceRef.current = true;
    setIsAiLoading(true);
    
    try {
      const response = await generateHydrationAdvice(buildContext());
      setAiResponse(response);

      const ctxHash = buildContextHash(propsRef.current);
      cacheHashRef.current = ctxHash;
      localStorage.setItem(`digiwell_ai_advice_v2_${profileId}`, JSON.stringify({ response, timestamp: Date.now(), ctxHash }));
    } catch (error: unknown) {
      console.error("Lỗi AI Advice:", error);
    } finally {
      setIsAiLoading(false);
      isFetchingAdviceRef.current = false;
    }
  }, [buildContext, isAiLoading]);

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
        });
      } catch {
        const { reply, waterAction } = await sendAiChatMessage(userText, chatContext);
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
    } catch {
      toast.error('AI đang bận hớp nước, đệ thử lại sau nhé!');
      updateLastModelMessage(() => 'AI đang bận một chút, bạn thử lại sau nhé.');
    } finally {
      setIsChatLoading(false);
      setTimeout(() => { isChattingRef.current = false; }, 1000);
    }
  };

  return {
    aiAdvice: aiResponse?.text || '',
    isAiLoading, 
    chatMessages, 
    setChatMessages,
    isChatLoading, 
    chatInput, 
    setChatInput, 
    fetchAIAdvice, 
    handleSendChatMessage
  };
}
