import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './en.json';
import translationVI from './vi.json';

import { AppStorage } from '@/lib/storage';

const resources = {
  en: { translation: translationEN },
  vi: { translation: translationVI }
};

// Lấy ngôn ngữ đã lưu hoặc mặc định là Tiếng Việt
const savedLanguage = AppStorage.getItem('digiwell_language') || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'vi',
    interpolation: { escapeValue: true }
  });

export default i18n;