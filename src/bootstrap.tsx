import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeProvider'
import './i18n'; // Khởi tạo đa ngôn ngữ

if (import.meta.env.DEV) {
  void import('vconsole').then(({ default: VConsole }) => {
    new VConsole();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
