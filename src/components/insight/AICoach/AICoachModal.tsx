import React, { useRef, useEffect } from 'react';
import { X, Send, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../../store/useUIStore';
import { useAiSocial } from '../../../context/AiSocialContext';
import TypingIndicator from '../../TypingIndicator';

const QUICK_ACTIONS = [
  { icon: Droplets, label: 'Uống 250ml', amount: 250 },
  { icon: Droplets, label: 'Uống 500ml', amount: 500 },
];

export default function AICoachModal() {
  const { showAiChat, setShowAiChat } = useUIStore();
  const { geminiProps } = useAiSocial();
  const { chatMessages, isChatLoading, chatInput, setChatInput, handleSendChatMessage } = geminiProps;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <AnimatePresence>
      {showAiChat && (
        <motion.div
          key="ai-coach-modal"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, { offset, velocity }) => {
            if (offset.y > 150 || velocity.y > 500) setShowAiChat(false);
          }}
          className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex flex-col"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 shrink-0" />
          
          <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
                🤖
              </div>
              <div>
                <h3 className="text-white font-black leading-none">DigiCoach AI</h3>
                <p className="text-[10px] text-emerald-400 uppercase tracking-widest mt-1 italic">Groq • Llama Engine</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAiChat(false)} 
              className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {chatMessages.map((msg: any, index: number) => (
              <motion.div
                key={`ai-msg-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-cyan-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-5 py-3 border-t border-white/5">
            <form onSubmit={handleSendChatMessage} className="relative">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Hỏi AI về sức khỏe..."
                className="w-full py-3 pl-4 pr-12 bg-slate-800/50 rounded-xl text-white text-sm outline-none focus:ring-2 ring-cyan-500/50 border border-white/5 transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-500 text-slate-950 rounded-lg font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}