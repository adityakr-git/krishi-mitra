import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, SupportedLanguage } from '../../context/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  showIcon = true 
}) => {
  const { currentLang, setLanguage } = useLanguage();

  return (
    <div className={`relative flex items-center gap-1 bg-soil-100/90 rounded-xl px-2.5 py-1 border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs ${className}`}>
      {showIcon && <Globe className="w-3.5 h-3.5 text-forest shrink-0" />}
      <select 
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)} 
        value={currentLang || 'hi'}
        className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer pr-1"
        aria-label="Change Language"
      >
        <option value="hi">हिंदी (Hindi)</option>
        <option value="en">English</option>
        <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
        <option value="mr">मराठी (Marathi)</option>
        <option value="bn">বাংলা (Bengali)</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
