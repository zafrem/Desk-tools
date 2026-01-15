import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations
import enCommon from '@/locales/en/common.json';
import enNavigation from '@/locales/en/navigation.json';
import enHome from '@/locales/en/home.json';
import enTools from '@/locales/en/tools.json';

// Korean translations
import koCommon from '@/locales/ko/common.json';
import koNavigation from '@/locales/ko/navigation.json';
import koHome from '@/locales/ko/home.json';
import koTools from '@/locales/ko/tools.json';

// Chinese translations
import zhCommon from '@/locales/zh/common.json';
import zhNavigation from '@/locales/zh/navigation.json';
import zhHome from '@/locales/zh/home.json';
import zhTools from '@/locales/zh/tools.json';

// Japanese translations
import jaCommon from '@/locales/ja/common.json';
import jaNavigation from '@/locales/ja/navigation.json';
import jaHome from '@/locales/ja/home.json';
import jaTools from '@/locales/ja/tools.json';

export const SUPPORTED_LANGUAGES = ['en', 'ko', 'zh', 'ja'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ko: '한국어',
  zh: '简体中文',
  ja: '日本語',
};

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    home: enHome,
    tools: enTools,
  },
  ko: {
    common: koCommon,
    navigation: koNavigation,
    home: koHome,
    tools: koTools,
  },
  zh: {
    common: zhCommon,
    navigation: zhNavigation,
    home: zhHome,
    tools: zhTools,
  },
  ja: {
    common: jaCommon,
    navigation: jaNavigation,
    home: jaHome,
    tools: jaTools,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Initial language for server-side compatibility
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'home', 'tools'],

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false, // Required for static export
    },
  });

export default i18n;
