import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw,
  Lock,
  Globe,
  CheckCircle2,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { authService, UserProfile, KNOWN_USERS } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { useProcurementStore } from '../../store/useProcurementStore';
import { Language } from '../../types';
import { getApiUrl } from '../../utils/api';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useAuthStore();
  const { language, setLanguage } = useProcurementStore();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: any;
    if (step === 'OTP' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    // Simulate SMS dispatch
    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
      setOtp('123456');
      setTimer(30);
      setCanResend(false);
    }, 400);
  };

  const handleResendOtp = () => {
    if (!canResend || loading) return;
    setErrorMessage('');
    setTimer(30);
    setCanResend(false);
    setOtp('123456');
  };

  const completeLoginForPhone = async (targetPhone: string) => {
    const cleanPhone = targetPhone.replace(/\D/g, '');
    let backendUser: UserProfile | null = null;

    // Try backend verification first
    try {
      const res = await fetch(getApiUrl('/api/auth/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          backendUser = data.user;
        }
      }
    } catch (err) {
      console.warn('[Backend Auth] API unreachable, using local mock session:', err);
    }

    // Fallback to local verified mock session
    if (!backendUser) {
      const localRes = authService.createVerifiedSession(cleanPhone);
      if (localRes.success && localRes.user) {
        backendUser = localRes.user;
      }
    }

    if (backendUser) {
      login(backendUser);
      onLoginSuccess(backendUser);
    } else {
      setErrorMessage('Authentication failed. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otp.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);

    setTimeout(async () => {
      try {
        await completeLoginForPhone(phone);
      } catch (err: any) {
        setErrorMessage('Verification failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // Direct 1-click shortcut login for testing & hackathon demonstration
  const handleQuickLogin = async (quickPhone: string) => {
    setLoading(true);
    setPhone(quickPhone);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        await completeLoginForPhone(quickPhone);
      } catch (err: any) {
        setErrorMessage('Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const fillQuickNumber = (num: string) => {
    setPhone(num);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-4 sm:p-6 selection:bg-forest-pale selection:text-forest-deep">
      
      {/* Top Bar with Language Selector */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <img 
            src="/krishi-mitra-logo.png" 
            alt="Krishi Mitra" 
            className="h-8 w-auto object-contain" 
          />
        </div>

        {/* Minimal Language Switcher */}
        <div className="relative flex items-center gap-1.5 bg-soil-100 rounded-xl px-2 py-1 text-xs font-semibold text-slate-700">
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

      {/* Center Auth Card with Official Brand Logo */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="text-center mb-6">
          <img 
            src="/krishi-mitra-logo.png" 
            alt="Krishi Mitra - Saathi Har Kisan Ka" 
            className="w-48 sm:w-52 h-auto mx-auto object-contain drop-shadow-xs select-none" 
          />
        </div>

        {/* Step 1: Mobile Phone Number */}
        {step === 'PHONE' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Mobile Number / मोबाइल नंबर
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-bold text-slate-500 text-sm border-r border-slate-200 pr-2.5">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit number"
                  className="w-full bg-soil-50 border border-slate-200 text-slate-900 font-bold text-base rounded-2xl pl-16 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-forest focus:bg-white transition-all"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs text-red-600 font-semibold">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full min-h-[48px] bg-forest hover:bg-forest-light active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to SMS Gateway...</span>
                </>
              ) : (
                <>
                  <span>Get OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Login Profiles (Always accessible in Mock/Prototype Mode) */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  ⚡ 1-Click Role Access (Demo)
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto Login
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('9876543210')}
                  className="p-2.5 rounded-xl bg-soil-100 hover:bg-forest-pale hover:border-forest/40 border border-slate-200 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <strong className="block text-xs font-bold text-slate-800 group-hover:text-forest">Farmer</strong>
                    <UserCheck className="w-3 h-3 text-slate-400 group-hover:text-forest" />
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">Ramesh Kumar</span>
                  <span className="text-[9px] text-slate-400 font-mono">9876543210</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('9812345670')}
                  className="p-2.5 rounded-xl bg-soil-100 hover:bg-forest-pale hover:border-forest/40 border border-slate-200 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <strong className="block text-xs font-bold text-slate-800 group-hover:text-forest">Officer</strong>
                    <UserCheck className="w-3 h-3 text-slate-400 group-hover:text-forest" />
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">S.P. Varma</span>
                  <span className="text-[9px] text-slate-400 font-mono">9812345670</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('9998887770')}
                  className="p-2.5 rounded-xl bg-soil-100 hover:bg-forest-pale hover:border-forest/40 border border-slate-200 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <strong className="block text-xs font-bold text-slate-800 group-hover:text-forest">Admin</strong>
                    <UserCheck className="w-3 h-3 text-slate-400 group-hover:text-forest" />
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">District Office</span>
                  <span className="text-[9px] text-slate-400 font-mono">9998887770</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: 6-Digit OTP Screen */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
            <div className="bg-soil-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">OTP sent to:</span>
                <strong className="text-sm font-bold text-slate-900">+91 {phone}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('PHONE');
                  setErrorMessage('');
                }}
                className="text-xs font-bold text-forest hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Enter 6-Digit OTP / ओटीपी दर्ज करें
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full tracking-widest text-center text-2xl font-black bg-soil-50 border border-slate-200 text-slate-900 rounded-2xl py-3 focus:outline-none focus:ring-2 focus:ring-forest focus:bg-white transition-all"
              />
              <div className="mt-2 text-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  डेमो OTP: <strong>123456</strong> (या कोई भी 6 अंक)
                </span>
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs text-red-600 font-semibold text-center">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full min-h-[48px] bg-forest hover:bg-forest-light active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Verify & Proceed</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-xs font-bold text-forest hover:underline disabled:opacity-50"
                >
                  Resend OTP via SMS
                </button>
              ) : (
                <span className="text-xs text-slate-400">
                  Resend OTP in <strong>{timer}s</strong>
                </span>
              )}
            </div>
          </form>
        )}

      </div>

      {/* Footer Security Badge */}
      <div className="max-w-md w-full mx-auto text-center text-slate-400 text-xs py-2 flex items-center justify-center gap-1.5 border-t border-slate-100">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Kisan Authentication Gateway • 256-Bit SSL Encrypted</span>
      </div>

    </div>
  );
};
