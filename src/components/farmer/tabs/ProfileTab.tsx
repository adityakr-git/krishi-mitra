import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Phone, 
  ShieldCheck, 
  Landmark, 
  Languages, 
  Eye, 
  Type, 
  LogOut,
  MapPin,
  CheckCircle2,
  FileCheck,
  Camera,
  PhoneCall
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useProcurementStore } from '../../../store/useProcurementStore';
import { useTranslation } from '../../../i18n/useTranslation';
import { LanguageSwitcher } from '../../common/LanguageSwitcher';
import { useAccessibility } from '../../../context/AccessibilityContext';

export const ProfileTab: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { 
    highContrast, 
    largeFont, 
    toggleHighContrast, 
    toggleLargeFont 
  } = useAccessibility();

  const { t, language } = useTranslation();

  const farmerName = user?.name || 'Ramesh Kumar';
  const farmerPhone = user?.phone || '9876543210';
  const kisanId = user?.kisanId || 'HR-GUR-2024-8841';

  // 1. Get the current active role from the session (saved during login)
  const activeRole = localStorage.getItem('krishi_mitra_session') || 'default';

  // 2. Create a dynamic storage key based on the role
  const PROFILE_PIC_KEY = `krishi_mitra_profile_pic_${activeRole}`;

  const [profilePic, setProfilePic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 3. Load ONLY the picture belonging to this specific role
    const savedPic = localStorage.getItem(PROFILE_PIC_KEY);
    if (savedPic) {
      setProfilePic(savedPic);
    }
  }, [PROFILE_PIC_KEY]);

  // Handle Image Selection and Convert to Base64 for LocalStorage
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePic(base64String);
        
        // 4. Save the picture to this specific role's key
        localStorage.setItem(PROFILE_PIC_KEY, base64String);
        window.dispatchEvent(new Event('krishi_mitra_profile_updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4 animate-fade-in mb-24">
      
      {/* Header */}
      <div className="px-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {language === 'hi' ? 'किसान प्रोफ़ाइल एवं सेटिंग्स' : 'Farmer Profile & Settings'}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {language === 'hi' ? 'पहचान, बैंक विवरण एवं ऐप प्राथमिकताएं' : 'Identity, Bank Verification & Preferences'}
        </p>
      </div>

      {/* Main Farmer Identity Card with Avatar Upload */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center pt-2">
          <div className="relative">
            {/* Avatar Image */}
            <div className="w-28 h-28 rounded-full border-4 border-forest overflow-hidden bg-slate-100 flex items-center justify-center shadow-lg">
              {profilePic ? (
                <img src={profilePic} alt="Farmer Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-slate-400 font-black">
                  {farmerName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Edit/Camera Button */}
            <button 
              type="button"
              onClick={triggerFileInput}
              title="फ़ोटो बदलें (Change Photo)"
              className="absolute bottom-0 right-0 bg-forest text-white p-2.5 rounded-full shadow-md hover:bg-forest-light transition-colors border-2 border-white active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <h2 className="text-xl font-bold mt-4 text-slate-900 text-center">{farmerName}</h2>
          <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" /> +91 {farmerPhone}
          </p>
          <span className="text-[11px] font-bold text-forest flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-forest-accent" /> {user?.village || 'Khandsa, Gurugram'}
          </span>
        </div>

        {/* Hidden File Input */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageChange} 
          className="hidden" 
        />

        <div className="p-3 bg-soil-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Kisan Registry ID
            </span>
            <strong className="text-xs font-black text-slate-900">{kisanId}</strong>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            Govt. Verified
          </span>
        </div>
      </div>

      {/* Government Verification Badges */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {language === 'hi' ? 'सरकारी सत्यापन स्थिति' : 'Verification Status'}
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 bg-soil-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <strong className="text-slate-900 block">Aadhaar Linked</strong>
                <span className="text-[10px] text-slate-400">UIDAI Biometric Authenticated</span>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="p-2.5 bg-soil-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <strong className="text-slate-900 block">Land Record Verified</strong>
                <span className="text-[10px] text-slate-400">4.2 Acres • Khandsa Khasra #841</span>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="p-2.5 bg-soil-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <div>
                <strong className="text-slate-900 block">DBT Linked Account</strong>
                <span className="text-[10px] text-slate-400">State Bank of India •••• 4092</span>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Kisan Helpline: Help & Support (Toll-Free 1800-180-1551) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          {language === 'hi' ? 'सहायता और संपर्क (Help & Support)' : 'Help & Support'}
        </h3>
        
        <a 
          href="tel:18001801551" 
          className="w-full bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-2xl p-4 flex items-center justify-between active:scale-95 transition-transform group shadow-2xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="bg-red-100 text-red-600 p-3 rounded-2xl group-hover:scale-105 transition-transform">
              <PhoneCall size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-red-700 text-base leading-tight">किसान कॉल सेंटर</h4>
              <p className="text-red-600/80 text-xs font-semibold">मुफ़्त कृषि सलाह (Toll-Free)</p>
            </div>
          </div>
          <div className="text-red-700 font-extrabold text-xs sm:text-sm tracking-wider font-mono bg-white px-2.5 py-1.5 rounded-xl border border-red-200 shadow-2xs">
            1800-180-1551
          </div>
        </a>
      </div>

      {/* Language Switcher Card (5 Indian Regional Languages) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {t('change_language')}
        </h3>

        <div className="flex items-center justify-between p-3 bg-soil-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2.5">
            <Languages className="w-5 h-5 text-forest" />
            <div>
              <strong className="text-xs text-slate-900 block">
                Regional Language / क्षेत्रीय भाषा
              </strong>
              <span className="text-[10px] text-slate-400">
                5 Languages available in native script
              </span>
            </div>
          </div>

          <LanguageSwitcher />
        </div>
      </div>

      {/* Accessibility Settings */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {language === 'hi' ? 'पहुंच एवं दृश्यता (Accessibility)' : 'Accessibility'}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-soil-50 rounded-2xl border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800">
                {language === 'hi' ? 'उच्च कंट्रास्ट (High Contrast)' : 'High Contrast'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleHighContrast}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                highContrast ? 'bg-forest' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-soil-50 rounded-2xl border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800">
                {language === 'hi' ? 'बड़ा फ़ॉन्ट (Large Font)' : 'Large Font'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleLargeFont}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                largeFont ? 'bg-forest' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                  largeFont ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Log out Button */}
      <button
        type="button"
        onClick={() => logout()}
        className="w-full py-3.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-extrabold text-xs rounded-2xl shadow-2xs flex items-center justify-center gap-2 transition-all active:scale-98"
      >
        <LogOut className="w-4 h-4 text-red-600" />
        <span>{language === 'hi' ? 'लॉग आउट करें (Sign Out)' : 'Log Out (Sign Out)'}</span>
      </button>

    </div>
  );
};
