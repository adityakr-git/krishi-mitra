import React, { useState, useEffect, useRef } from 'react';
import { authService, UserProfile } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { useProcurementStore } from '../../store/useProcurementStore';
import { Language } from '../../types';
import { getApiUrl } from '../../utils/api';
import { 
  Globe, 
  ShieldCheck, 
  User, 
  Phone, 
  Lock, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: (user: UserProfile) => void;
}

export interface RegisteredFarmer {
  id: string;
  name: string;
  phone: string;
  password: string;
  document: string;
  status: 'pending' | 'approved';
}

const DEFAULT_SAMPLE_DOCUMENT = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="%23f8fafc"><rect width="100%" height="100%" fill="%23fdfbf7" stroke="%23cbd5e1" stroke-width="4"/><rect x="20" y="20" width="560" height="50" fill="%231a4d2e" rx="6"/><text x="300" y="52" fill="white" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">राजस्व विभाग • भू-अभिलेख (खसरा-खतौनी एवं आधार)</text><text x="40" y="110" fill="%23334155" font-family="sans-serif" font-size="14" font-weight="bold">राज्य / State: हरियाणा (Haryana) | जिला: गुरुग्राम (Gurugram)</text><text x="40" y="140" fill="%23334155" font-family="sans-serif" font-size="14">तहसील: बादशाहपुर | उप-संभाग: सोहना रोड</text><line x1="40" y1="160" x2="560" y2="160" stroke="%23e2e8f0" stroke-width="2"/><text x="40" y="195" fill="%231e293b" font-family="sans-serif" font-size="15" font-weight="bold">खातेदार का नाम: रमेश कुमार पुत्र श्री रामेश्वर दयाल</text><text x="40" y="225" fill="%23475569" font-family="sans-serif" font-size="13">आधार संख्या: XXXX-XXXX-4092 (प्रमाणित व लिंक)</text><text x="40" y="255" fill="%23475569" font-family="sans-serif" font-size="13">खसरा संख्या: 142/18, 143/2, 144/1 • कुल रकबा: 4.85 हेक्टेयर</text><text x="40" y="285" fill="%23475569" font-family="sans-serif" font-size="13">मुख्य फसल: गेहूं (Sharbati) • सरसों (Mustard)</text><rect x="40" y="320" width="160" height="45" fill="%23ecfdf5" stroke="%2310b981" rx="8"/><text x="120" y="348" fill="%23065f46" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">✓ भू-अभिलेख सत्यापित</text></svg>`;

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useAuthStore();
  const { language, setLanguage } = useProcurementStore();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [activeView, setActiveView] = useState<'farmer' | 'officer' | 'admin'>('farmer');

  // Login Form States (Initialized empty by default)
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup Form States
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDocument, setSignupDocument] = useState<string>('');
  const [documentFileName, setDocumentFileName] = useState<string>('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure initial registered_farmers structure exists in localStorage
  useEffect(() => {
    const existing = localStorage.getItem('registered_farmers');
    if (!existing) {
      const initialFarmers: RegisteredFarmer[] = [
        {
          id: 'F-101',
          name: 'Ramesh Kumar',
          phone: '9876543210',
          password: 'password123',
          document: DEFAULT_SAMPLE_DOCUMENT,
          status: 'pending' // Initial pending review status as requested
        }
      ];
      localStorage.setItem('registered_farmers', JSON.stringify(initialFarmers));
    }
  }, []);

  // Handle Document File Upload for Signup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignupDocument(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleDoc = () => {
    setSignupDocument(DEFAULT_SAMPLE_DOCUMENT);
    setDocumentFileName('Sample_Khasra_Khatauni_Haryana.svg');
  };

  // 1. Farmer Registration (Signup Mode) with Neon Backend API
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    const cleanPhone = signupPhone.replace(/\D/g, '');

    if (!signupName.trim()) {
      setSignupError('कृपया पूरा नाम दर्ज करें। (Please enter your full name)');
      return;
    }

    if (cleanPhone.length !== 10) {
      setSignupError('कृपया सही 10-अंकीय मोबाइल नंबर दर्ज करें। (Enter valid 10-digit mobile number)');
      return;
    }

    if (signupPassword.length < 4) {
      setSignupError('पासवर्ड कम से कम 4 अक्षरों का होना चाहिए। (Password must be at least 4 characters)');
      return;
    }

    const docToSave = signupDocument || DEFAULT_SAMPLE_DOCUMENT;
    setIsSubmitting(true);

    try {
      const res = await fetch(getApiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName.trim(),
          phone: cleanPhone,
          password: signupPassword,
          document: docToSave
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.error || 'पंजीकरण में त्रुटि। कृपया पुनः प्रयास करें।');
        setIsSubmitting(false);
        return;
      }

      // Sync with localStorage for instant local reactivity
      const existingData: RegisteredFarmer[] = JSON.parse(localStorage.getItem('registered_farmers') || '[]');
      const newFarmer: RegisteredFarmer = {
        id: data.user?.id || `F-${Math.floor(100 + Math.random() * 900)}`,
        name: signupName.trim(),
        phone: cleanPhone,
        password: signupPassword,
        document: docToSave,
        status: 'pending'
      };
      const updatedData = [...existingData.filter(f => f.phone !== cleanPhone), newFarmer];
      localStorage.setItem('registered_farmers', JSON.stringify(updatedData));
      window.dispatchEvent(new Event('registered_farmers_updated'));

      setSignupSuccess(true);
    } catch (err) {
      console.warn('Backend signup error, using local fallback:', err);
      const existingData: RegisteredFarmer[] = JSON.parse(localStorage.getItem('registered_farmers') || '[]');
      if (existingData.find(f => f.phone === cleanPhone)) {
        setSignupError('यह मोबाइल नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।');
        setIsSubmitting(false);
        return;
      }
      const newFarmer: RegisteredFarmer = {
        id: `F-${Math.floor(100 + Math.random() * 900)}`,
        name: signupName.trim(),
        phone: cleanPhone,
        password: signupPassword,
        document: docToSave,
        status: 'pending'
      };
      localStorage.setItem('registered_farmers', JSON.stringify([...existingData, newFarmer]));
      window.dispatchEvent(new Event('registered_farmers_updated'));
      setSignupSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Farmer Login (Login Mode) with Neon Backend API
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanPhone = loginPhone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      setLoginError('कृपया सही 10-अंकीय मोबाइल नंबर दर्ज करें।');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          password: loginPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'गलत क्रेडेंशियल्स। कृपया फोन नंबर और पासवर्ड जांचें।');
        setIsSubmitting(false);
        return;
      }

      const user = data.user;

      // If status === 'pending'
      if (user.status === 'pending') {
        setLoginError('⚠️ आपका खाता अभी सत्यापन के लिए कतार में है। कृपया प्रतीक्षा करें। (Your account is currently under review by Mandi Officer.)');
        setIsSubmitting(false);
        return;
      }

      // If status === 'approved' -> Proceed to Farmer Dashboard
      if (user.status === 'approved') {
        localStorage.setItem('krishi_mitra_session', 'farmer');
        const session = authService.createVerifiedSession(user.phone, user.id);
        if (session.success && session.user) {
          session.user.name = user.name;
          login(session.user);
          if (onLoginSuccess) {
            onLoginSuccess(session.user);
          }
        }
      }
    } catch (err) {
      console.warn('Backend login error, checking local storage:', err);
      const registeredFarmers: RegisteredFarmer[] = JSON.parse(localStorage.getItem('registered_farmers') || '[]');
      const farmer = registeredFarmers.find(f => f.phone === cleanPhone);

      if (!farmer || farmer.password !== loginPassword) {
        setLoginError('गलत क्रेडेंशियल्स। कृपया फोन नंबर और पासवर्ड जांचें। (Invalid credentials.)');
        setIsSubmitting(false);
        return;
      }

      if (farmer.status === 'pending') {
        setLoginError('⚠️ आपका खाता अभी सत्यापन के लिए कतार में है। कृपया प्रतीक्षा करें। (Your account is currently under review by Mandi Officer.)');
        setIsSubmitting(false);
        return;
      }

      if (farmer.status === 'approved') {
        localStorage.setItem('krishi_mitra_session', 'farmer');
        const session = authService.createVerifiedSession(farmer.phone, farmer.id);
        if (session.success && session.user) {
          session.user.name = farmer.name;
          login(session.user);
          if (onLoginSuccess) {
            onLoginSuccess(session.user);
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Portal Login Execution (Dedicated view login)
  const executeLogin = (role: 'officer' | 'admin') => {
    localStorage.setItem('krishi_mitra_session', role);
    const phone = role === 'officer' ? '9812345670' : '9998887770';
    const session = authService.createVerifiedSession(phone);
    if (session.success && session.user) {
      login(session.user);
      if (onLoginSuccess) {
        onLoginSuccess(session.user);
      }
    }
    if (role === 'officer') window.location.href = '/officer-dashboard';
    if (role === 'admin') window.location.href = '/admin-dashboard';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-4 sm:p-6 selection:bg-forest-pale selection:text-forest-deep">
      
      {/* Top Header with Language Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-wider text-forest uppercase">
            Krishi Mitra • राष्ट्रीय कृषि पोर्टल
          </span>
        </div>
        <div className="relative flex items-center gap-1.5 bg-soil-100 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="en">English (EN)</option>
            <option value="hi">हिन्दी (HI)</option>
            <option value="pa">ਪੰਜਾਬੀ (PA)</option>
            <option value="mr">मराठी (MR)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col items-center p-4 sm:p-6 w-full max-w-md mx-auto my-auto">
        {/* Logo Header */}
        <img 
          src="/krishi-mitra-logo.png" 
          alt="Krishi Mitra" 
          className="w-44 sm:w-48 mb-6 mt-2 select-none object-contain drop-shadow-xs" 
        />

        {/* ================= FARMER VIEW ================= */}
        {activeView === 'farmer' && (
          <>
            {/* Dual-Mode Selector (Login vs Signup) */}
        <div className="w-full flex rounded-2xl bg-soil-100 p-1.5 mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setSignupSuccess(false);
              setLoginError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'LOGIN'
                ? 'bg-white text-forest shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            लॉगिन करें (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('SIGNUP');
              setSignupSuccess(false);
              setSignupError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'SIGNUP'
                ? 'bg-white text-forest shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            नया खाता बनाएं (Signup)
          </button>
        </div>

        {/* ========================================================= */}
        {/* SIGNUP MODE */}
        {/* ========================================================= */}
        {mode === 'SIGNUP' && (
          <div className="w-full">
            {signupSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-4 animate-fade-in shadow-sm">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-emerald-900">
                    आपका पंजीकरण सफल रहा!
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium mt-2 leading-relaxed">
                    मंडी अधिकारी द्वारा दस्तावेज़ों की जांच के बाद आप लॉगिन कर सकेंगे।
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    (Registration successful. You can log in after officer verification.)
                  </p>
                </div>
                <div className="bg-white/80 p-3 rounded-2xl border border-emerald-100 text-left space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">किसान का नाम:</span>
                    <strong className="text-slate-800">{signupName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">पंजीकृत मोबाइल:</span>
                    <strong className="text-slate-800">+91 {signupPhone}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-emerald-50">
                    <span className="text-slate-500">वर्तमान स्थिति:</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> सत्यापन कतार में (Pending)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoginPhone(signupPhone);
                    setLoginPassword(signupPassword);
                    setMode('LOGIN');
                    setSignupSuccess(false);
                  }}
                  className="w-full bg-forest hover:bg-forest-light text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-md"
                >
                  लॉगिन पृष्ठ पर जाएं (Go to Login)
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-base font-extrabold text-slate-800">
                    किसान पंजीकरण (Farmer Registration)
                  </h2>
                  <p className="text-xs text-slate-500">
                    मंडी प्रवेश व सीधी खरीद हेतु विवरण दर्ज करें
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name / किसान का नाम
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="उदा. रमेश कुमार (Ramesh Kumar)"
                      className="w-full bg-soil-50 border border-slate-200 text-slate-900 font-bold text-sm rounded-xl pl-10 pr-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-forest focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number / मोबाइल नंबर
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 font-bold text-slate-500 text-sm border-r border-slate-200 pr-2">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit number"
                      className="w-full bg-soil-50 border border-slate-200 text-slate-900 font-bold text-sm rounded-xl pl-16 pr-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-forest focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Set Password / गुप्त पासवर्ड
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-soil-50 border border-slate-200 text-slate-900 font-bold text-sm rounded-xl pl-10 pr-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-forest focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Aadhaar / Land Record (खसरा-खतौनी / आधार)
                  </label>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-3.5 text-center bg-soil-50 hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {documentFileName ? (
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                        <span className="truncate font-semibold text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-forest" />
                          {documentFileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-forest font-bold hover:underline ml-2 shrink-0"
                        >
                          बदलें
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Upload className="w-4 h-4 text-forest" />
                          दस्तावेज़ अपलोड करें (Upload Document)
                        </button>
                        <span className="text-[10px] text-slate-400 block">या</span>
                        <button
                          type="button"
                          onClick={handleUseSampleDoc}
                          className="text-[11px] text-forest font-bold hover:underline"
                        >
                          📄 नमूना खसरा-खतौनी उपयोग करें (Use Mock Land Record)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {signupError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{signupError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#1A4D2E] hover:bg-[#133c23] text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>पंजीकरण सबमिट करें (Submit Registration)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* LOGIN MODE */}
        {/* ========================================================= */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-base font-extrabold text-slate-800">
                किसान लॉगिन (Farmer Login)
              </h2>
              <p className="text-xs text-slate-500">
                पंजीकृत मोबाइल नंबर और पासवर्ड से प्रवेश करें
              </p>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number / मोबाइल नंबर
              </label>
              <div className="flex w-full border rounded-xl overflow-hidden bg-gray-50 focus-within:border-green-600 focus-within:bg-white transition-colors">
                <span className="p-3.5 font-bold text-gray-500 border-r bg-soil-100 text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit number"
                  className="w-full p-3.5 bg-transparent outline-none font-bold text-base text-slate-900"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password / पासवर्ड
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-soil-50 border border-slate-200 text-slate-900 font-bold text-sm rounded-xl pl-10 pr-3.5 py-3.5 focus:outline-none focus:ring-2 focus:ring-forest focus:bg-white transition-all"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-2.5 animate-fade-in shadow-2xs">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#1A4D2E] text-white font-extrabold text-sm p-4 rounded-xl flex justify-center items-center gap-2 hover:bg-[#133c23] transition-colors shadow-md active:scale-98"
            >
              <span>लॉगिन करें (Log In)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Testing Console (Now changes views instead of logging in) */}
        <div className="w-full mt-12 border-t border-gray-200 pt-8 pb-4">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Official Portals</p>
          <div className="flex flex-col gap-3">
            <button 
              type="button"
              onClick={() => setActiveView('officer')} 
              className="w-full bg-[#0F172A] text-white p-4 rounded-xl font-bold flex justify-between items-center hover:bg-gray-800 transition-colors shadow-md active:scale-98"
            >
              <div className="flex flex-col items-start">
                <span>Mandi Officer Portal</span>
                <span className="text-xs text-gray-400 font-normal">S.P. Varma (Badge #409)</span>
              </div>
              <span>→</span>
            </button>
            <button 
              type="button"
              onClick={() => setActiveView('admin')} 
              className="w-full bg-[#1E3A8A] text-white p-4 rounded-xl font-bold flex justify-between items-center hover:bg-blue-900 transition-colors shadow-md active:scale-98"
            >
              <div className="flex flex-col items-start">
                <span>District Admin Portal</span>
                <span className="text-xs text-blue-200 font-normal">Command Center</span>
              </div>
              <span>→</span>
            </button>
          </div>
        </div>
      </>
    )}

    {/* ================= OFFICER VIEW ================= */}
    {activeView === 'officer' && (
      <div className="w-full animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Mandi Officer Login</h2>
        <p className="text-sm text-gray-500 mb-6">Authorized APMC personnel only.</p>
        
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Officer ID</label>
          <input type="text" readOnly value="OFFICER-409" className="w-full p-4 border rounded-xl bg-gray-100 text-gray-600 font-mono" />
        </div>
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
          <input type="password" readOnly value="demo1234" className="w-full p-4 border rounded-xl bg-gray-100 text-gray-600" />
        </div>

        <button 
          type="button"
          onClick={() => executeLogin('officer')} 
          className="w-full bg-[#0F172A] text-white font-bold p-4 rounded-xl hover:bg-gray-800 mb-4 shadow-lg transition-all active:scale-98"
        >
          Secure Login →
        </button>
        <button 
          type="button"
          onClick={() => setActiveView('farmer')} 
          className="w-full text-gray-500 font-bold p-4 hover:text-gray-800 transition-colors"
        >
          ← Back to Farmer Login
        </button>
      </div>
    )}

    {/* ================= ADMIN VIEW ================= */}
    {activeView === 'admin' && (
      <div className="w-full animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800 mb-2">District Admin Login</h2>
        <p className="text-sm text-gray-500 mb-6">Command center access.</p>
        
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Admin ID</label>
          <input type="text" readOnly value="ADMIN-GURUGRAM" className="w-full p-4 border rounded-xl bg-gray-100 text-gray-600 font-mono" />
        </div>
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
          <input type="password" readOnly value="adminDemo" className="w-full p-4 border rounded-xl bg-gray-100 text-gray-600" />
        </div>

        <button 
          type="button"
          onClick={() => executeLogin('admin')} 
          className="w-full bg-[#1E3A8A] text-white font-bold p-4 rounded-xl hover:bg-blue-900 mb-4 shadow-lg transition-all active:scale-98"
        >
          Secure Login →
        </button>
        <button 
          type="button"
          onClick={() => setActiveView('farmer')} 
          className="w-full text-gray-500 font-bold p-4 hover:text-gray-800 transition-colors"
        >
          ← Back to Farmer Login
        </button>
      </div>
    )}

      </div>

      <div className="max-w-md w-full mx-auto text-center text-slate-400 text-xs py-2 border-t border-slate-100">
        <span>Krishi Mitra National Portal • Kisan Registration & Authentication Gateway</span>
      </div>

    </div>
  );
};

export default LoginView;
