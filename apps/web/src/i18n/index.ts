import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
    
    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'i18next',
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    defaultNS: 'common',
    ns: ['common', 'auth', 'menu', 'user', 'role', 'rule'],

    interpolation: {
      escapeValue: false, // React 已经转义
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;

// 辅助函数：切换语言
export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  // 保存到 localStorage
  localStorage.setItem('i18nextLng', lang);
  // 同时设置 cookie 供后端使用
  document.cookie = `locale=${lang}; path=/; max-age=31536000`;
};

// 获取当前语言
export const getCurrentLanguage = () => {
  return i18n.language || 'zh-CN';
};

// 语言列表
export const supportedLanguages = [
  { key: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { key: 'en-US', label: 'English', flag: '🇺🇸' },
  { key: 'ja-JP', label: '日本語', flag: '🇯🇵' },
  { key: 'ko-KR', label: '한국어', flag: '🇰🇷' },
];
