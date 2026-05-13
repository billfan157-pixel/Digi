import AppBootstrap from '@/app/AppBootstrap';
import AppShell from '@/app/AppShell';
import { useAppShellController } from '@/features/app/useAppShellController';
import { AiSocialProvider } from './context/AiSocialContext';
import { ThemeProvider } from './components/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary'; // ✅ ĐÃ THÊM: Import Error Boundary

// ============================================================================
// DIGIWELL SMART WELLNESS - PREMIUM DARK UI (V7 FIXED)
// FIX #1: handleRegister upsert profiles sau signUp
// FIX #2: waterGoal tự động theo Calendar/Watch thay vì currentActivity thủ công
// FIX #3: Added ErrorBoundary to prevent white screen on crash
// ============================================================================

function AppContent() {
  const appShellProps = useAppShellController();
  return <AppShell {...appShellProps} />;
}

export default function App() {
  return (
    // ✅ ĐÃ SỬA: Bao bọc toàn bộ app trong ErrorBoundary
    <ErrorBoundary>
      <AppBootstrap>
        <AiSocialProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AiSocialProvider>
      </AppBootstrap>
    </ErrorBoundary>
  );
}