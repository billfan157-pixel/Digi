import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { 
  generateHydrationAdvice, 
  sendAiChatMessage, 
  type AiChatMessage, 
  type DigiwellAiContext 
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
  // Giải quyết dứt điểm lỗi vòng lặp vô hạn do App.tsx re-render mỗi giây
  const propsRef = useRef(props);
  useEffect(() => { propsRef.current = props; });

  // --- [1] STATES ---
  const [aiAdvice, setAiAdvice] = useState('');
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
      setAiAdvice('');
      hasFetchedInitialAdvice.current = false; // Reset cờ để user mới đăng nhập vẫn nhận được lời khuyên
    }
  }, [profile?.id]);

  // --- [2] BUILD CONTEXT (Gom dữ liệu gửi cho AI) ---
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
  }, []); // Ngắt hoàn toàn vòng lặp do loại bỏ dependencies cập nhật thường xuyên

  // --- [3] ACTIONS ---

  // Lấy lời khuyên nhanh (Tab Insight)
  const fetchAIAdvice = useCallback(async () => {
    const profileId = propsRef.current.profile?.id;
    if (!profileId) return;
    
    if (isFetchingAdviceRef.current || isAiLoading) {
      if (import.meta.env.DEV) console.warn("🛡️ [GUARD] API Call prevented to save quota");
      return;
    }

    isFetchingAdviceRef.current = true;
    setIsAiLoading(true);
    if (import.meta.env.DEV) console.warn("🚀 [API CALL] Sending to Gemini...");
    
    try {
      const advice = await generateHydrationAdvice(buildContext());
      setAiAdvice(advice);
      localStorage.setItem(`digiwell_ai_advice_${profileId}`, JSON.stringify({ advice, timestamp: Date.now() }));
    } catch (error: unknown) {
      console.error("Lỗi AI Advice:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('429') || errMsg.includes('Too Many Requests') || errMsg.includes('rate limit')) {
        setAiAdvice('Hệ thống AI đang quá tải do có nhiều lượt truy cập. Vui lòng thử lại sau ít phút đệ nhé! 💧');
      } else {
        setAiAdvice('DigiCoach đang nghỉ ngơi một chút, đệ uống nước trước nhé! 💧');
      }
    } finally {
      setIsAiLoading(false);
      setTimeout(() => { isFetchingAdviceRef.current = false; }, 2000); // Debounce 2s để tránh dính lỗi 429
    }
  }, [buildContext, isAiLoading]);

  // Tự động gọi lời khuyên khi user đã đăng nhập và chưa từng fetch trong session hiện tại
  useEffect(() => {
    if (!profile?.id || hasFetchedInitialAdvice.current) return;

    hasFetchedInitialAdvice.current = true;

    const cacheKey = `digiwell_ai_advice_${profile.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { advice, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 4 * 60 * 60 * 1000) {
          setAiAdvice(advice);
          return;
        }
      } catch (e) {}
    }

    void fetchAIAdvice();
  }, [fetchAIAdvice, profile?.id]);

  // Chat và điều khiển hệ thống
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!chatInput.trim()) return;
    
    if (isChatLoading || isChattingRef.current) {
      if (import.meta.env.DEV) console.warn("🛡️ [GUARD] API Call prevented to save quota");
      return;
    }

    isChattingRef.current = true;
    const userText = chatInput.trim();
    const userMsg: AiChatMessage = { role: 'user', content: userText };
    
    // Đẩy tin nhắn của mình lên trước cho thật (UI/UX)
    setChatMessages((prev: AiChatMessage[]) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);
    
    if (import.meta.env.DEV) console.warn("🚀 [API CALL] Sending to Gemini...");

    try {
      const { reply, waterAction } = await sendAiChatMessage(userText, buildContext());
      
      const assistantMsg: AiChatMessage = { role: 'model', content: reply };
      setChatMessages((prev: AiChatMessage[]) => [...prev, assistantMsg]);

      // --- [PHẪU THUẬT LOGIC: AI ĐIỀU KHIỂN APP] ---
      const p = propsRef.current;
      
      // 1. Nếu AI nhận diện hành động uống nước
      if (waterAction && p.handleAddWater) {
        await p.handleAddWater(waterAction.amount, waterAction.factor, waterAction.name);
        toast.success(`AI đã ghi nhận: ${waterAction.amount}ml ${waterAction.name}`);
      }
      
      // 2. Phân tích ý định (Intent Parsing) để đóng modal và mở tính năng tương ứng
      const lowerReply = reply.toLowerCase();
      
      // Tránh việc AI chỉ đang "nói về" báo cáo mà mình đã xuất. 
      // Chỉ kích hoạt nếu có các từ khóa mang tính hành động.
      const shouldTriggerAction = (keywords: string[]) => keywords.some(kw => lowerReply.includes(kw));

      if (shouldTriggerAction(['báo cáo', 'xuất pdf', 'tạo file']) && p.handleExportPDF) {
        toast.info("Đang tạo báo cáo sức khỏe...");
        p.setShowAiChat?.(false);
        setTimeout(p.handleExportPDF, 500); // Delay nhẹ để UI đóng mượt
      } 
      else if (shouldTriggerAction(['lịch sử', 'uống khi nào', 'xem lại']) && p.setShowHistory) {
        p.setShowAiChat?.(false);
        p.setShowHistory?.(true);
      } 
      else if (shouldTriggerAction(['nhịn ăn', 'fasting', 'giờ ăn']) && p.toggleFastingMode) {
        p.setShowAiChat?.(false);
        p.toggleFastingMode?.();
      }

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('429') || errMsg.includes('Too Many Requests') || errMsg.includes('rate limit')) {
        toast.error('Hệ thống AI đang quá tải. Vui lòng thử lại sau ít phút nhé!');
        setChatMessages((prev: AiChatMessage[]) => [...prev, { role: 'model', content: 'Hệ thống AI đang quá tải do có nhiều lượt truy cập. Đệ chờ vài phút rồi nhắn lại cho ta nhé! ⏳' }]);
      } else {
        toast.error('AI đang bận hớp nước, đệ thử lại sau nhé!');
      }
    } finally {
      setIsChatLoading(false);
      setTimeout(() => { isChattingRef.current = false; }, 1000); // 1s debounce
    }
  };

  return {
    aiAdvice, 
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
