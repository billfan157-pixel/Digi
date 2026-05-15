/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';
import { useAiSocialOrchestration } from '@/features/app/useAiSocialOrchestration';

type AiSocialContextType = ReturnType<typeof useAiSocialOrchestration>;

const AiSocialContext = createContext<AiSocialContextType | null>(null);

export function AiSocialProvider({ children }: { children: React.ReactNode }) {
  const aiSocialData = useAiSocialOrchestration();
  return (
    <AiSocialContext.Provider value={aiSocialData}>
      {children}
    </AiSocialContext.Provider>
  );
}

export function useAiSocial() {
  const context = useContext(AiSocialContext);
  if (!context) {
    throw new Error('useAiSocial must be used within an AiSocialProvider');
  }
  return context;
}
