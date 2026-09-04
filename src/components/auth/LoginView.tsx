import React, { useState } from 'react';
import { authService, UserProfile } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { useProcurementStore } from '../../store/useProcurementStore';
import { Language } from '../../types';
import { Globe } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useAuthStore();
  const { language, setLanguage } = useProcurementStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');

  // 1. Fake OTP Trigger
  const handleGetOTP = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length === 10) {
      setShowOtp(true);
    } else {
      alert("कृपया 10 अंकों का मोबाइल नंबर दर्ज करें। (Please enter a valid 10-digit mobile number)");
    }
  };

  // 2. Fake OTP Verification
  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '123456' || otp.length === 6) { // Accepts hardcoded mock OTP 123456
      // Determine role if a known number was typed, or default to farmer
      const cleanDigits = phoneNumber.replace(/\D/g, '');
      let role = 'farmer';
      if (cleanDigits === '9812345670') role = 'officer';
      else if (cleanDigits === '9998887770') role = 'admin';
      
      handleMockLogin(role);
    } else {
      alert("गलत OTP! (Demo OTP is 123456)");
    }
  };

  // 3. The Shortcut / Demo Login Engine
  const handleMockLogin = (role: string) => {
    // Save mock session
    localStorage.setItem('krishi_mitra_session', role);

    const phoneMap: Record<string, string> = {
      farmer: '9876543210',
      officer: '9812345670',
      admin: '9998887770'
    };

    const targetPhone = phoneMap[role.toLowerCase()] || phoneNumber || '9876543210';
    const session = authService.createVerifiedSession(targetPhone);

    if (session.success && session.user) {
      login(session.user);
      if (onLoginSuccess) {
        onLoginSuccess(session.user);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-4 sm:p-6">
      
      {/* Top Header with Language Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold tracking-wider text-forest uppercase">
            Krishi Mitra
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

      <div className="flex flex-col items-center p-6 w-full max-w-md mx-auto my-auto">
        {/* Logo Header */}
        <img 
          src="/krishi-mitra-logo.png" 
          alt="Krishi Mitra" 
          className="w-48 mb-8 mt-4 select-none object-contain" 
        />

        {/* Main Login Form */}
        <form className="w-full" onSubmit={showOtp ? handleVerifyOTP : handleGetOTP}>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
            Mobile Number / मोबाइल नंबर
          </label>
          
          <div className="flex w-full border rounded-xl overflow-hidden mb-6 bg-gray-50 focus-within:border-green-600 transition-colors">
            <span className="p-4 font-bold text-gray-500 border-r">+91</span>
            <input 
              type="tel"
              maxLength={10}
              className="w-full p-4 bg-transparent outline-none font-bold text-lg text-slate-900"
              placeholder="Enter 10-digit number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              disabled={showOtp}
            />
          </div>

          {showOtp && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Enter OTP (Use 123456) / ओटीपी दर्ज करें
              </label>
              <input 
                type="text"
                maxLength={6}
                autoFocus
                className="w-full p-4 border rounded-xl bg-gray-50 outline-none font-bold text-lg text-center tracking-[1em] text-slate-900 focus:border-green-600"
                value={otp}
                placeholder="123456"
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-xs text-green-700 font-medium">
                  ✓ Demo Code: <strong>123456</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtp(false);
                    setOtp('');
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-green-700 underline"
                >
                  Change Number
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-[#1A4D2E] text-white font-bold p-4 rounded-xl flex justify-center items-center gap-2 hover:bg-[#133c23] transition-colors shadow-sm"
          >
            {showOtp ? "Verify OTP" : "Get OTP →"}
          </button>
        </form>

        {/* Development Shortcuts */}
        <div className="w-full mt-10 border-t pt-8">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Development Environment Shortcuts
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button 
              type="button"
              onClick={() => handleMockLogin('farmer')} 
              className="bg-gray-100 p-3 rounded-lg text-left hover:bg-gray-200 transition-colors"
            >
              <h4 className="font-bold text-sm text-gray-800">Farmer</h4>
              <p className="text-xs text-gray-500">Ramesh Kumar</p>
            </button>
            <button 
              type="button"
              onClick={() => handleMockLogin('officer')} 
              className="bg-gray-100 p-3 rounded-lg text-left hover:bg-gray-200 transition-colors"
            >
              <h4 className="font-bold text-sm text-gray-800">Officer</h4>
              <p className="text-xs text-gray-500">S.P. Varma</p>
            </button>
            <button 
              type="button"
              onClick={() => handleMockLogin('admin')} 
              className="bg-gray-100 p-3 rounded-lg text-left hover:bg-gray-200 transition-colors"
            >
              <h4 className="font-bold text-sm text-gray-800">Admin</h4>
              <p className="text-xs text-gray-500">District Office</p>
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-md w-full mx-auto text-center text-slate-400 text-xs py-2 border-t border-slate-100">
        <span>Krishi Mitra Gateway • Demonstration & Hackathon Mode</span>
      </div>

    </div>
  );
};

export default LoginView;
