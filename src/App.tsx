import AppBootstrap from '@/app/AppBootstrap';
import AppShell from '@/app/AppShell';
import { useAppShellController } from '@/features/app/useAppShellController';
import { AiSocialProvider } from './context/AiSocialContext';

// ============================================================================
// DIGIWELL SMART WELLNESS - PREMIUM DARK UI (V7 FIXED)
// FIX #1: handleRegister upsert profiles sau signUp
// FIX #2: waterGoal tự động theo Calendar/Watch thay vì currentActivity thủ công
// ============================================================================

function AppContent() {
  const appShellProps = useAppShellController();
  return <AppShell {...appShellProps} />;
}

export default function App() {
  return (
    <AppBootstrap>
      <AiSocialProvider>
        <AppContent />
      </AiSocialProvider>
    </AppBootstrap>
  );
}
