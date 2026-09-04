import React from 'react';
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
  FileCheck
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useProcurementStore } from '../../../store/useProcurementStore';
import { useTranslation } from '../../../i18n/useTranslation';

export const ProfileTab: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { 
    accessibilityHighContrast, 
    largeFont, 
    toggleHighContrast, 
    toggleLargeFont 
  } = useProcurementStore();

  const { language, toggleLanguage } = useTranslation();

  const farmerName = user?.name || 'Ramesh Kumar';
  const farmerPhone = user?.phone || '9876543210';
  const kisanId = user?.kisanId || 'HR-GUR-2024-8841';

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Header */}
      <div className="px-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {language === 'hi' ? 'किसान प्रोफ़ाइल एवं सेटिंग्स' : 'Farmer Profile & Settings'}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {language === 'hi' ? 'पहचान, बैंक विवरण एवं ऐप प्राथमिकताएं' : 'Identity, Bank Verification & Preferences'}
        </p>
      </div>

      {/* Main Farmer Identity Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-forest text-forest-pale font-black text-xl flex items-center justify-center shadow-md border-2 border-forest-accent/30 shrink-0">
            {farmerName.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-0.5">
            <h2 className="text-base font-extrabold text-slate-900">{farmerName}</h2>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> +91 {farmerPhone}
            </span>
            <span className="text-[11px] font-bold text-forest flex items-center gap-1">
              <MapPin className="w-3 h-3 text-forest-accent" /> {user?.village || 'Khandsa, Gurugram'}
            </span>
          </div>
        </div>

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

      {/* Language Switcher Card */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {language === 'hi' ? 'भाषा चयन (Language)' : 'App Language'}
        </h3>

        <div className="flex items-center justify-between p-3 bg-soil-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2.5">
            <Languages className="w-5 h-5 text-forest" />
            <div>
              <strong className="text-xs text-slate-900 block">
                {language === 'hi' ? 'वर्तमान भाषा: हिन्दी' : 'Active Language: English'}
              </strong>
              <span className="text-[10px] text-slate-400">
                {language === 'hi' ? 'अंग्रेजी में बदलने के लिए टैप करें' : 'Tap to switch to Hindi'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest text-white text-xs font-black shadow-sm transition-all active:scale-95"
          >
            <span>A/अ</span>
            <span>{language === 'hi' ? 'English' : 'हिन्दी'}</span>
          </button>
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
                accessibilityHighContrast ? 'bg-forest' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                  accessibilityHighContrast ? 'translate-x-6' : 'translate-x-1'
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
