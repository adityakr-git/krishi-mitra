import React from 'react';
import { 
  Home, 
  MapPin, 
  Plus, 
  CreditCard, 
  User 
} from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

export type FarmerTabType = 'home' | 'nearby' | 'history' | 'profile';

interface FarmerBottomNavProps {
  activeTab: FarmerTabType;
  onChangeTab: (tab: FarmerTabType) => void;
  onOpenBookModal: () => void;
}

export const FarmerBottomNav: React.FC<FarmerBottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenBookModal
}) => {
  const { language } = useTranslation();

  return (
    <nav 
      aria-label="Farmer Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl px-2 py-1.5 flex items-center justify-between pointer-events-auto relative">
        
        {/* 1. 🏠 Home (होम) */}
        <button
          type="button"
          onClick={() => onChangeTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'home' ? 'text-forest font-black scale-105' : 'text-slate-500 font-semibold hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'home' ? 'bg-forest-pale' : ''}`}>
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {language === 'hi' ? 'होम' : 'Home'}
          </span>
        </button>

        {/* 2. 📍 Nearby (मंडियां) */}
        <button
          type="button"
          onClick={() => onChangeTab('nearby')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'nearby' ? 'text-forest font-black scale-105' : 'text-slate-500 font-semibold hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'nearby' ? 'bg-forest-pale' : ''}`}>
            <MapPin className={`w-5 h-5 ${activeTab === 'nearby' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {language === 'hi' ? 'मंडियां' : 'Nearby'}
          </span>
        </button>

        {/* 3. ➕ Book (बुक करें) -> [PROMINENT RAISED CENTER BUTTON] */}
        <div className="relative -top-5 flex flex-col items-center justify-center shrink-0 px-2">
          <button
            type="button"
            onClick={onOpenBookModal}
            title={language === 'hi' ? 'मंडी स्लॉट बुक करें' : 'Book Mandi Slot'}
            aria-label="Book Mandi Slot"
            className="w-14 h-14 rounded-full bg-forest hover:bg-forest-light text-white shadow-xl shadow-forest/30 border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
          >
            <Plus className="w-7 h-7 stroke-[3] text-white group-hover:rotate-90 transition-transform duration-200" />
          </button>
          <span className="text-[10px] font-black text-forest mt-0.5 tracking-tight">
            {language === 'hi' ? 'बुक करें' : 'Book'}
          </span>
        </div>

        {/* 4. 💳 History (खाता) */}
        <button
          type="button"
          onClick={() => onChangeTab('history')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'history' ? 'text-forest font-black scale-105' : 'text-slate-500 font-semibold hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'history' ? 'bg-forest-pale' : ''}`}>
            <CreditCard className={`w-5 h-5 ${activeTab === 'history' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {language === 'hi' ? 'खाता' : 'History'}
          </span>
        </button>

        {/* 5. 👤 Profile (प्रोफ़ाइल) */}
        <button
          type="button"
          onClick={() => onChangeTab('profile')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'profile' ? 'text-forest font-black scale-105' : 'text-slate-500 font-semibold hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-forest-pale' : ''}`}>
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {language === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}
          </span>
        </button>

      </div>
    </nav>
  );
};
