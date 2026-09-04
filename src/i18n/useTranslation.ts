import { useTranslation as useI18NextTranslation } from 'react-i18next';
import { useProcurementStore } from '../store/useProcurementStore';

/**
 * Universal translation hook for Krishi Mitra
 * Powered by react-i18next and synchronized with 5 Indian regional languages
 */
export function useTranslation() {
  const { t, i18n } = useI18NextTranslation();
  const { setLanguage: setStoreLanguage } = useProcurementStore();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
    setStoreLanguage(nextLang as any);
  };

  const setLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setStoreLanguage(lng as any);
  };

  return {
    t,
    i18n,
    language: i18n.language || 'hi',
    toggleLanguage,
    setLanguage
  };
}
