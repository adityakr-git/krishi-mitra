import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { translations } from '../translations';
import i18n from '../i18n';

export type SupportedLanguage = 'hi' | 'en' | 'pa' | 'mr' | 'bn';

export interface LanguageContextType {
  currentLang: SupportedLanguage;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('preferred_language') || localStorage.getItem('i18nextLng');
      if (saved && (saved === 'hi' || saved === 'en' || saved === 'pa' || saved === 'mr' || saved === 'bn')) {
        return saved as SupportedLanguage;
      }
    } catch {}
    return 'hi';
  });

  // Keep i18next synchronized whenever currentLang changes
  useEffect(() => {
    try {
      localStorage.setItem('preferred_language', currentLang);
      localStorage.setItem('i18nextLng', currentLang);
      if (i18n && i18n.language !== currentLang) {
        i18n.changeLanguage(currentLang);
      }
    } catch {}
  }, [currentLang]);

  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
  };

  const toggleLanguage = () => {
    setCurrentLang((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  // Explicit, resilient translation function with string interpolation support
  const t = (key: string, variables?: Record<string, string | number>): string => {
    const langDict = (translations as any)[currentLang] || (translations as any)['hi'] || (translations as any)['en'] || {};
    let text = langDict[key] || (translations as any)['hi']?.[key] || (translations as any)['en']?.[key] || key;

    if (variables && typeof text === 'string') {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        language: currentLang,
        setLanguage,
        toggleLanguage,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
