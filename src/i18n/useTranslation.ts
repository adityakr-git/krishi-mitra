import { useProcurementStore } from '../store/useProcurementStore';
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';

export type TranslationKey = keyof typeof enTranslations;

const dictionaries: Record<string, Record<string, string>> = {
  en: enTranslations,
  hi: hiTranslations
};

/**
 * Universal translation hook for Krishi Mitra
 * Synchronizes with global language state in useProcurementStore
 */
export function useTranslation() {
  const { language, setLanguage } = useProcurementStore();

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    // Default to 'hi' if Hindi selected, else 'en'
    const dict = dictionaries[language] || dictionaries['en'];
    let text = dict[key] || enTranslations[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(val));
      });
    }

    return text;
  };

  const toggleLanguage = () => {
    // Toggle strictly between English and Hindi as requested
    const nextLang = language === 'hi' ? 'en' : 'hi';
    setLanguage(nextLang as any);
  };

  return {
    t,
    language,
    toggleLanguage,
    setLanguage
  };
}
