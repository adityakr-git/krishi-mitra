import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useProcurementStore } from './store/useProcurementStore';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/common/Header';
import { ProfileDrawer } from './components/common/ProfileDrawer';
import { OfflineBanner } from './components/common/OfflineBanner';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { CropQualityPreCheck } from './components/ai/CropQualityPreCheck';
import { VoiceAssistantModal } from './components/ai/VoiceAssistantModal';
import { FarmerDashboard } from './components/farmer/FarmerDashboard';
import { OfficerDashboard } from './components/officer/OfficerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SplashScreen } from './components/splash/SplashScreen';
import { UserProfile } from './services/authService';
import { useAccessibility } from './context/AccessibilityContext';

export function App() {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const { highContrast: accessibilityHighContrast, largeFont } = useAccessibility();

  const [showSplash, setShowSplash] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCropPreCheck, setShowCropPreCheck] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  useEffect(() => {
    checkAuth();
    // Clean legacy generic profile pic key if present to prevent cross-persona pollution
    if (typeof window !== 'undefined' && localStorage.getItem('krishi_mitra_profile_pic')) {
      localStorage.removeItem('krishi_mitra_profile_pic');
    }
  }, []);

  // 1. Native-Style Animated Splash Screen (Initial Entry)
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Centralized Authentication Gateway: If not authenticated, render Login
  if (!isAuthenticated || !user) {
    return <LoginView onLoginSuccess={() => {}} />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      accessibilityHighContrast ? 'high-contrast' : 'bg-soil-50 text-slate-900'
    } ${largeFont ? 'large-text' : ''}`}>
      
      {/* Offline Status Warning Bar */}
      <OfflineBanner />

      {/* Clean Minimal Header (Logo, Bell, Language Toggle, Profile Avatar) */}
      <Header
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenProfile={() => setShowProfile(true)}
      />

      {/* Main Role Workspaces */}
      <main className="flex-1 pb-16">
        {user.role === 'FARMER' && (
          <FarmerDashboard
            onOpenCropCheck={() => setShowCropPreCheck(true)}
            onOpenVoice={() => setShowVoiceAssistant(true)}
          />
        )}

        {user.role === 'OFFICER' && (
          <OfficerDashboard />
        )}

        {user.role === 'ADMIN' && (
          <AdminDashboard />
        )}
      </main>

      {/* Sliding Profile & Settings Drawer */}
      <ProfileDrawer
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onLogout={() => {
          setShowProfile(false);
          logout();
        }}
      />

      {/* Notification Center */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Crop Pre-Check Modal */}
      <CropQualityPreCheck
        isOpen={showCropPreCheck}
        onClose={() => setShowCropPreCheck(false)}
      />

      {/* Persistent AI Voice Assistant */}
      <VoiceAssistantModal
        isOpen={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
        autoStart={true}
      />

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <p className="font-semibold text-slate-700">
            🌾 Krishi Mitra (कृषि मित्र) • Digital Procurement Ecosystem
          </p>
          <p className="text-[11px] text-slate-400">
            Certified Mandi Queues & Transparent Direct Benefit Transfer (DBT)
          </p>
        </div>
      </footer>

    </div>
  );
}

export default App;
