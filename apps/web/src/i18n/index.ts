import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// 导入翻译文件（作为 fallback，确保至少有默认翻译）
import zhCN_common from '../../public/locales/zh-CN/common.json';
import zhCN_auth from '../../public/locales/zh-CN/auth.json';
import zhCN_menu from '../../public/locales/zh-CN/menu.json';
import zhCN_dashboard from '../../public/locales/zh-CN/dashboard.json';
import zhCN_user from '../../public/locales/zh-CN/user.json';
import zhCN_role from '../../public/locales/zh-CN/role.json';
import zhCN_rule from '../../public/locales/zh-CN/rule.json';

import enUS_common from '../../public/locales/en-US/common.json';
import enUS_auth from '../../public/locales/en-US/auth.json';
import enUS_menu from '../../public/locales/en-US/menu.json';
import enUS_dashboard from '../../public/locales/en-US/dashboard.json';
import enUS_user from '../../public/locales/en-US/user.json';
import enUS_role from '../../public/locales/en-US/role.json';
import enUS_rule from '../../public/locales/en-US/rule.json';

import jaJP_common from '../../public/locales/ja-JP/common.json';
import jaJP_auth from '../../public/locales/ja-JP/auth.json';
import jaJP_menu from '../../public/locales/ja-JP/menu.json';
import jaJP_dashboard from '../../public/locales/ja-JP/dashboard.json';
import jaJP_user from '../../public/locales/ja-JP/user.json';
import jaJP_role from '../../public/locales/ja-JP/role.json';
import jaJP_rule from '../../public/locales/ja-JP/rule.json';

import koKR_common from '../../public/locales/ko-KR/common.json';
import koKR_auth from '../../public/locales/ko-KR/auth.json';
import koKR_menu from '../../public/locales/ko-KR/menu.json';
import koKR_dashboard from '../../public/locales/ko-KR/dashboard.json';
import koKR_user from '../../public/locales/ko-KR/user.json';
import koKR_role from '../../public/locales/ko-KR/role.json';
import koKR_rule from '../../public/locales/ko-KR/rule.json';

// 预加载的翻译资源（解构嵌套的命名空间，只有 menu 和 dashboard 有嵌套）
const resources = {
  'zh-CN': {
    common: zhCN_common,
    auth: zhCN_auth,
    menu: zhCN_menu.menu,
    dashboard: zhCN_dashboard.dashboard,
    user: zhCN_user,
    role: zhCN_role,
    rule: zhCN_rule,
  },
  'en-US': {
    common: enUS_common,
    auth: enUS_auth,
    menu: enUS_menu.menu,
    dashboard: enUS_dashboard.dashboard,
    user: enUS_user,
    role: enUS_role,
    rule: enUS_rule,
  },
  'ja-JP': {
    common: jaJP_common,
    auth: jaJP_auth,
    menu: jaJP_menu.menu,
    dashboard: jaJP_dashboard.dashboard,
    user: jaJP_user,
    role: jaJP_role,
    rule: jaJP_rule,
  },
  'ko-KR': {
    common: koKR_common,
    auth: koKR_auth,
    menu: koKR_menu.menu,
    dashboard: koKR_dashboard.dashboard,
    user: koKR_user,
    role: koKR_role,
    rule: koKR_rule,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
    
    // 使用预加载资源，避免网络请求失败导致的问题
    resources,

    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'i18next',
    },

    defaultNS: 'common',
    ns: ['common', 'auth', 'menu', 'user', 'role', 'rule', 'dashboard'],

    interpolation: {
      escapeValue: false, // React 已经转义
    },

    react: {
      useSuspense: false, // 禁用 Suspense 避免测试环境问题
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
  });

// 挂载到 window 以便调试
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.i18n = i18n;
}

export default i18n;

// 辅助函数：切换语言
export const changeLanguage = async (lang: string) => {
  // 等待 i18n 语言切换完成
  await i18n.changeLanguage(lang);
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
