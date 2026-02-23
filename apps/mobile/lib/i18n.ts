/**
 * Minimal i18n setup. Import this once in app/_layout.tsx before rendering.
 * Add more keys to locales/en.json and use: const { t } = useTranslation(); t('key')
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';

const resources = {
  en: { translation: en },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
