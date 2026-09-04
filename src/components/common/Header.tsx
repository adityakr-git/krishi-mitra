import React from 'react';
import { 
  Sprout, 
  Bell, 
  User 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProcurementStore } from '../../store/useProcurementStore';
import { useTranslation } from '../../i18n/useTranslation';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNotifications, 
  onOpenProfile 
}) => {
  const { user } = useAuthStore();
  const { notifications } = useProcurementStore();
  const { language, toggleLanguage, t } = useTranslation();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm transition-colors">
      <div className="max-w-md md:max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Krishi Mitra Official Brand Logo */}
          <div className="flex items-center gap-2">
            <img 
              src="/krishi-mitra-logo.png" 
              alt="Krishi Mitra" 
              className="h-9 sm:h-10 w-auto object-contain select-none" 
            />
          </div>

          {/* Clean Top Action Bar: Notification, Language Toggle, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Notification Bell (🔔) */}
            <button
              onClick={onOpenNotifications}
              title={t('notifications')}
              aria-label={t('notifications')}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Language Toggle (A/अ) - Toggles globally between English & Hindi */}
            <button
              onClick={toggleLanguage}
              title={t('change_language')}
              aria-label={t('change_language')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-soil-100 hover:bg-forest-pale hover:text-forest text-slate-800 text-xs font-bold border border-slate-200 transition-all active:scale-95 shadow-xs"
            >
              <span className="text-forest font-black text-xs">A/अ</span>
              <span className="text-[11px] font-extrabold text-slate-700">
                {language === 'hi' ? 'हिन्दी' : 'English'}
              </span>
            </button>

            {/* Profile Avatar Icon */}
            <button
              onClick={onOpenProfile}
              title={t('profile')}
              aria-label={t('profile')}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors ml-0.5"
            >
              <div className="w-8 h-8 rounded-full bg-forest text-forest-pale font-extrabold text-xs flex items-center justify-center border border-forest-accent/30 shadow-sm">
                {user?.name?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />}
              </div>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
