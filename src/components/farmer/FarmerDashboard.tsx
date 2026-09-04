import React, { useState, useEffect } from 'react';
import { useProcurementStore } from '../../store/useProcurementStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Token } from '../../types';
import { socketService, QueueUpdatePayload } from '../../services/socketService';
import { playChime } from '../../utils/soundEffects';

// Navigation & Tab Views
import { FarmerBottomNav, FarmerTabType } from './FarmerBottomNav';
import { HomeTab } from './tabs/HomeTab';
import { NearbyTab } from './tabs/NearbyTab';
import { HistoryTab } from './tabs/HistoryTab';
import { ProfileTab } from './tabs/ProfileTab';
import { VoiceAssistantFAB } from './VoiceAssistantFAB';

interface FarmerDashboardProps {
  onOpenCropCheck: () => void;
  onOpenVoice: () => void;
}

const OFFLINE_TOKEN_KEY = 'krishi_mitra_cached_token';

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ 
  onOpenCropCheck, 
  onOpenVoice 
}) => {
  const { user } = useAuthStore();
  const { 
    activeToken, 
    mandis, 
    bookNewToken,
    advanceActiveTokenQueue,
    isOffline: storeIsOffline
  } = useProcurementStore();

  const { language } = useTranslation();

  // Active Mobile Tab State
  const [activeTab, setActiveTab] = useState<FarmerTabType>('home');
  const [liveSyncNotice, setLiveSyncNotice] = useState<string | null>(null);
  const [isNetworkOffline, setIsNetworkOffline] = useState(
    typeof window !== 'undefined' ? !window.navigator.onLine : false
  );

  // Booking Modal States
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('Wheat (Kanak)');
  const [selectedVariety, setSelectedVariety] = useState('Sharbati');
  const [quantity, setQuantity] = useState<number>(40);
  const [selectedMandiId, setSelectedMandiId] = useState('mandi-sohna');
  const [selectedSlot, setSelectedSlot] = useState('11:00 AM - 12:00 PM');

  // Cache token in localStorage for offline PWA gate entry
  useEffect(() => {
    if (activeToken && typeof window !== 'undefined') {
      try {
        localStorage.setItem(OFFLINE_TOKEN_KEY, JSON.stringify(activeToken));
      } catch (e) {
        console.warn('[PWA] Failed to cache token locally', e);
      }
    }
  }, [activeToken]);

  // Network online/offline event listeners
  useEffect(() => {
    const handleOnline = () => setIsNetworkOffline(false);
    const handleOffline = () => setIsNetworkOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isEffectivelyOffline = isNetworkOffline || storeIsOffline;

  // Retrieve cached token if memory token is somehow missing while offline
  const displayToken: Token = (() => {
    if (activeToken) return activeToken;
    try {
      const cached = localStorage.getItem(OFFLINE_TOKEN_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return activeToken;
  })();

  // Real-Time Socket.io Connection to Mandi Room
  useEffect(() => {
    if (isEffectivelyOffline) return;

    socketService.connect();
    socketService.joinMandiRoom(displayToken.mandiId);

    const handleQueueUpdate = (data: QueueUpdatePayload) => {
      console.log('[FarmerDashboard] Real-Time queue update received:', data);
      playChime();
      
      // Advance local state when backend emits queue update
      advanceActiveTokenQueue();
      
      setLiveSyncNotice(
        language === 'hi'
          ? `लाइव अपडेट: कतार आगे बढ़ी। प्रतीक्षा समय: ${data.estimatedWaitMinutes} मिनट`
          : `Live update: Queue advanced. Wait time: ${data.estimatedWaitMinutes} mins`
      );
      setTimeout(() => setLiveSyncNotice(null), 4000);
    };

    socketService.onQueueUpdated(handleQueueUpdate);

    return () => {
      socketService.off('queue_updated');
      socketService.leaveMandiRoom(displayToken.mandiId);
    };
  }, [displayToken.mandiId, isEffectivelyOffline, language]);

  const handleBookToken = (e: React.FormEvent) => {
    e.preventDefault();
    bookNewToken(selectedCrop, selectedVariety, Number(quantity), selectedMandiId, selectedSlot);
    setShowBookModal(false);
  };

  const handleSelectMandiForBooking = (mandiId: string) => {
    setSelectedMandiId(mandiId);
    setShowBookModal(true);
  };

  const farmerName = user?.name || 'Ramesh Kumar';

  return (
    <div className="w-full flex justify-center py-2 sm:py-4 px-3 min-h-screen bg-soil-50/50">
      
      {/* Strict Native Phone Screen Viewport Container (max-w-[440px] with pb-28 scroll clearance) */}
      <div className="w-full max-w-[440px] pb-28 relative">
        
        {/* Render Active Mobile Tab */}
        {activeTab === 'home' && (
          <HomeTab
            farmerName={farmerName}
            displayToken={displayToken}
            isEffectivelyOffline={isEffectivelyOffline}
            liveSyncNotice={liveSyncNotice}
            onOpenCropCheck={onOpenCropCheck}
            onOpenBookModal={() => setShowBookModal(true)}
          />
        )}

        {activeTab === 'nearby' && (
          <NearbyTab
            onSelectMandiForBooking={handleSelectMandiForBooking}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            displayToken={displayToken}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab />
        )}

      </div>

      {/* Floating Voice Assistant Action Button (FAB) at Bottom-Right */}
      <VoiceAssistantFAB onOpenVoice={onOpenVoice} />

      {/* Fixed Bottom Navigation Bar with Prominent Raised Center "Book Slot" FAB */}
      <FarmerBottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenBookModal={() => setShowBookModal(true)}
      />

      {/* Book Slot Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-forest text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {language === 'hi' ? 'मंडी स्लॉट बुक करें' : 'Book Mandi Procurement Slot'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="text-forest-pale hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookToken} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'फसल (Crop)' : 'Crop'}
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-soil-50 font-semibold focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  <option value="Wheat (Kanak)">Wheat (Kanak) - MSP ₹2,275</option>
                  <option value="Mustard (Sarson)">Mustard (Sarson) - MSP ₹5,650</option>
                  <option value="Gram (Chana)">Gram (Chana) - MSP ₹5,440</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'hi' ? 'किस्म (Variety)' : 'Variety'}
                  </label>
                  <input
                    type="text"
                    value={selectedVariety}
                    onChange={(e) => setSelectedVariety(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-soil-50 font-semibold focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'hi' ? 'मात्रा (Qtl)' : 'Quantity (Qtl)'}
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-soil-50 font-semibold focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'मंडी केंद्र (Mandi)' : 'Mandi Center'}
                </label>
                <select
                  value={selectedMandiId}
                  onChange={(e) => setSelectedMandiId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-soil-50 font-semibold focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  {mandis.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.avgWaitMinutes}m wait)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'समय स्लॉट (Time Slot)' : 'Time Slot'}
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-soil-50 font-semibold focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  <option value="10:30 AM - 11:30 AM">10:30 AM - 11:30 AM</option>
                  <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                  <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-forest text-white font-extrabold shadow-md"
                >
                  {language === 'hi' ? 'टोकन बनाएं' : 'Generate Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
