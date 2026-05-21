import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Thiết lập biến môi trường giả lập cho Supabase trong môi trường test (CI)
vi.stubEnv('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL || 'https://plbwqjdrivyffrhpbmvm.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYndxamRyaXZ5ZmZyaHBibXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjY3NjYsImV4cCI6MjA5MDcwMjc2Nn0.nZDHmQyVdn4a99zISog9-hzOzsFQ7G8RClV8GPe7sJw');
vi.stubEnv('VITE_SUPABASE_READ_URL', import.meta.env.VITE_SUPABASE_READ_URL || 'https://plbwqjdrivyffrhpbmvm.supabase.co');

afterEach(() => {
  cleanup();
});

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
};
