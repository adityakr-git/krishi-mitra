import React from 'react';
import { 
  Sprout, 
  Bell, 
  User,
  PhoneCall 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProcurementStore } from '../../store/useProcurementStore';
import { useTranslation } from '../../i18n/useTranslation';
import { LanguageSwitcher } from './LanguageSwitcher';

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
  const [profilePic, setProfilePic] = React.useState<string | null>(null);

  React.useEffect(() => {
    const updatePic = () => {
      const saved = localStorage.getItem('krishi_mitra_profile_pic');
      setProfilePic(saved);
    };
    updatePic();

    window.addEventListener('krishi_mitra_profile_updated', updatePic);
    window.addEventListener('storage', updatePic);
    return () => {
      window.removeEventListener('krishi_mitra_profile_updated', updatePic);
      window.removeEventListener('storage', updatePic);
    };
  }, []);

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

          {/* Clean Top Action Bar: Helpline, Notification, Language Toggle, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick Call Kisan Helpline (1800-180-1551) */}
            <a 
              href="tel:18001801551" 
              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center border border-red-100 active:scale-95"
              title="किसान कॉल सेंटर (Kisan Helpline: 1800-180-1551)"
              aria-label="Kisan Helpline"
            >
              <PhoneCall className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </a>

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

            {/* Multi-Language Switcher (5 Major Regional Languages) */}
            <LanguageSwitcher />

            {/* Profile Avatar Icon */}
            <button
              onClick={onOpenProfile}
              title={t('profile')}
              aria-label={t('profile')}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors ml-0.5"
            >
              <div className="w-8 h-8 rounded-full bg-forest text-forest-pale font-extrabold text-xs flex items-center justify-center border border-forest-accent/30 shadow-sm overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />
                )}
              </div>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
