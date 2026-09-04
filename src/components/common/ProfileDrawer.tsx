import React, { useState } from 'react';
import { 
  X, 
  User, 
  LogOut, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Eye, 
  Type, 
  Volume2, 
  VolumeX, 
  Landmark, 
  CheckCircle2, 
  CreditCard 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProcurementStore } from '../../store/useProcurementStore';
import { setGlobalMute, getGlobalMute } from '../../utils/soundEffects';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose, onLogout }) => {
  const { user } = useAuthStore();
  const { 
    accessibilityHighContrast, 
    toggleHighContrast, 
    largeFont, 
    toggleLargeFont 
  } = useProcurementStore();

  const [muted, setMuted] = useState(getGlobalMute());
  const [profilePic, setProfilePic] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setGlobalMute(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-up sm:animate-none border-l border-slate-200">
        
        {/* Header */}
        <div>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-soil-50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-forest text-forest-pale flex items-center justify-center font-bold text-xs overflow-hidden border border-forest-accent/30 shadow-sm">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.slice(0, 2).toUpperCase() || 'KM'
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{user?.name}</h3>
                <span className="text-[10px] text-slate-500 capitalize">{user?.role?.toLowerCase()} Profile</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Details & Identity Verification */}
          <div className="p-4 space-y-4 text-xs overflow-y-auto max-h-[calc(100vh-200px)]">
            
            {/* Gov ID Card */}
            <div className="bg-soil-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Official Credentials & Registry
              </span>

              {user?.kisanId && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kisan ID:</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{user.kisanId}</strong>
                </div>
              )}

              {user?.officerBadge && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Badge ID:</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{user.officerBadge}</strong>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mobile Number:</span>
                <strong className="text-slate-900 font-medium">+91 {user?.phone}</strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Aadhaar Status:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Linked & Verified
                </span>
              </div>

              {user?.bankAccountMasked && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Direct Benefit Transfer (DBT) Account:</span>
                  <strong className="text-slate-900 font-semibold block mt-0.5">
                    {user.bankAccountMasked}
                  </strong>
                </div>
              )}

              {user?.village && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500">Village / Tehsil:</span>
                  <strong className="text-slate-800">{user.village}</strong>
                </div>
              )}
            </div>

            {/* Accessibility & Preferences */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                App Accessibility Settings
              </span>

              <button
                onClick={toggleHighContrast}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>High Contrast Mode</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  accessibilityHighContrast ? 'bg-forest text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {accessibilityHighContrast ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={toggleLargeFont}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-slate-500" />
                  <span>Large Font Mode</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  largeFont ? 'bg-forest text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {largeFont ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={handleToggleMute}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  {muted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-slate-500" />}
                  <span>Queue Voice & Chimes</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  !muted ? 'bg-forest text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {!muted ? 'ON' : 'MUTED'}
                </span>
              </button>
            </div>

          </div>
        </div>

        {/* Footer with Log Out Action */}
        <div className="p-4 border-t border-slate-200 bg-soil-50">
          <button
            onClick={onLogout}
            className="w-full min-h-[44px] bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Krishi Mitra</span>
          </button>
        </div>

      </div>
    </div>
  );
};
