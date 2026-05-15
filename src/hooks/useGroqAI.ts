import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { 
  generateHydrationAdvice, 
  sendAiChatMessage, 
  type AiChatMessage, 
  type DigiwellAiContext,
  type AiAdviceResponse 
} from '../lib/ai';

export interface UseGeminiAIProps {
  profile: { id?: string; nickname?: string; goal?: string; activity?: string; climate?: string } | null;
  waterIntake: number;
  waterGoal: number;
  weatherData: { temp?: number; status?: string; location?: string } | null;
  watchData: { heartRate?: number; steps?: number } | null;
  isWeatherSynced: boolean;
  isWatchConnected: boolean;
  handleAddWater: (amount: number, factor: number, name: string) => Promise<void>;
  setShowAiChat?: (show: boolean) => void;
  handleExportPDF?: () => Promise<void>;
  toggleFastingMode?: () => void;
  setShowHistory?: (show: boolean) => void;
}

const defaultWelcomeMessage: AiChatMessage = {
  role: 'model',
  content: 'Chào đệ! Hôm nay DigiCoach đã sẵn sàng đồng hành cùng đệ. Hãy bắt đầu bằng cách uống một ly nước nhé!'
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
    return {
      nowIso: new Date().toISOString(),
      waterIntake: p.waterIntake,
      waterGoal: p.waterGoal,
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
      } : undefined
    };
  }, []);

  // --- [3] ACTIONS ---


  const fetchAIAdvice = useCallback(async () => {
    const profileId = propsRef.current.profile?.id;
    if (!profileId) return;
    
    if (isFetchingAdviceRef.current || isAiLoading) return;

    isFetchingAdviceRef.current = true;
    setIsAiLoading(true);
    
    try {
      const response = await generateHydrationAdvice(buildContext());
      setAiResponse(response);

      localStorage.setItem(`digiwell_ai_advice_v2_${profileId}`, JSON.stringify({ response, timestamp: Date.now() }));
    } catch (error: unknown) {
      console.error("Lỗi AI Advice:", error);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => { isFetchingAdviceRef.current = false; }, 2000);
    }
  }, [buildContext, isAiLoading]);

  useEffect(() => {
    if (!profile?.id || hasFetchedInitialAdvice.current) return;
    hasFetchedInitialAdvice.current = true;

    const cacheKey = `digiwell_ai_advice_v2_${profile.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { response, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 4 * 60 * 60 * 1000) {
          setAiResponse(response);
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
      const { reply, waterAction } = await sendAiChatMessage(userText, buildContext());
      setChatMessages((prev) => [...prev, { role: 'model', content: reply }]);

      const p = propsRef.current;
      if (waterAction && p.handleAddWater) {
        await p.handleAddWater(waterAction.amount, waterAction.factor, waterAction.name);
        toast.success(`Ghi nhận: ${waterAction.amount}ml ${waterAction.name}`);
      }
      
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
    } catch {
      toast.error('AI đang bận hớp nước, đệ thử lại sau nhé!');
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
