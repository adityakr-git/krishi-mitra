import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { 
  Clock, 
  MapPin, 
  Plus, 
  Camera, 
  Radio, 
  WifiOff,
  Ticket,
  Maximize2
} from 'lucide-react';
import { Token } from '../../../types';
import { useTranslation } from '../../../i18n/useTranslation';
import { MandiBhavTicker } from '../MandiBhavTicker';
import { WeatherAdvisoryWidget } from '../WeatherAdvisoryWidget';
import { ProcurementTracker } from '../ProcurementTracker';

interface HomeTabProps {
  farmerName: string;
  displayToken: Token;
  activeBooking?: any;
  isEffectivelyOffline: boolean;
  liveSyncNotice: string | null;
  onOpenCropCheck: () => void;
  onOpenBookModal: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  farmerName,
  displayToken,
  activeBooking,
  isEffectivelyOffline,
  liveSyncNotice,
  onOpenCropCheck,
  onOpenBookModal
}) => {
  const { t, language } = useTranslation();
  const [showFullPassModal, setShowFullPassModal] = useState(false);

  const hasActiveToken = Boolean(
    displayToken && 
    displayToken.id && 
    displayToken.status !== 'COMPLETED' && 
    displayToken.status !== 'CANCELLED'
  );

  const handleScrollToPass = () => {
    const el = document.getElementById('smart-token-pass');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Hero Section Restructuring with Primary CTA */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('welcome', { name: farmerName })}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t('todays_status')}
          </p>
        </div>

        {/* Primary Hero Action Button */}
        {hasActiveToken ? (
          <button
            type="button"
            onClick={handleScrollToPass}
            className="flex items-center gap-1.5 bg-forest-pale text-forest hover:bg-forest hover:text-white font-extrabold text-xs px-3.5 py-2 rounded-2xl border border-forest-accent/40 shadow-xs transition-all active:scale-95"
            title={t('digital_pass')}
          >
            <Ticket className="w-4 h-4 text-forest-accent" />
            <span>{t('digital_pass')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenBookModal}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all animate-pulse-subtle"
            title={t('book_slot')}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ {t('book_slot')}</span>
          </button>
        )}
      </div>

      {/* Offline Mode Banner */}
      {isEffectivelyOffline && (
        <div className="bg-amber-50 border border-amber-300 text-amber-950 text-xs px-3.5 py-2 rounded-2xl flex items-center justify-between gap-2 animate-slide-up shadow-xs font-semibold">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t('offline_mode_badge')}</span>
          </div>
          <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
            QR Valid
          </span>
        </div>
      )}

      {/* Real-Time Live Sync Notice */}
      {liveSyncNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs px-3 py-2 rounded-2xl flex items-center gap-2 animate-slide-up shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{liveSyncNotice}</span>
        </div>
      )}

      {/* Today's Market Rates (Mandi Bhav Ticker) */}
      <MandiBhavTicker />

      {/* Weather & Harvest Advisory */}
      <WeatherAdvisoryWidget />

      {/* 
        CONDITIONAL RENDERING OF DIGITAL PASS & 5-STEP TRACKER
        Only render pass and tracker if an active booking exists.
        Otherwise, render clean Empty State to generate new token.
      */}
      {!activeBooking ? (
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-forest-pale text-forest rounded-3xl mx-auto flex items-center justify-center shadow-xs">
            <Ticket className="w-8 h-8 text-forest" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {language === 'hi' ? 'नया टोकन जनरेट करें' : 'Generate New Token'}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {language === 'hi'
                ? 'मंडी में अपनी फसल लाने के लिए तारीख व समय स्लॉट बुक करें और डिजिटल गेट पास प्राप्त करें।'
                : 'Book a convenient time slot to bring your harvest to the mandi and get your instant Digital Pass.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenBookModal}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-md transition-all inline-flex items-center gap-2 animate-pulse-subtle"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{language === 'hi' ? 'स्लॉट बुक करें (Book Slot)' : 'Book Slot'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* The Unified Smart Token (High-contrast, clean digital pass - 100% visible offline) */}
          <div 
            id="smart-token-pass"
            className="bg-forest text-white rounded-3xl p-5 shadow-lg relative overflow-hidden border border-forest-light scroll-mt-20"
          >
            {/* Subtle watermark */}
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-forest-light/20 rounded-full pointer-events-none" />

            {/* Top Token Badge & Mandi */}
            <div className="flex items-start justify-between gap-2 border-b border-forest-light/40 pb-3">
              <div>
                <span className="text-[10px] font-bold text-forest-pale uppercase tracking-wider block">
                  {t('digital_pass')}
                </span>
                <span className="text-3xl font-black tracking-tight text-white block leading-tight">
                  #{activeBooking.id || displayToken.id}
                </span>
                <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-forest-accent" />
                  {activeBooking.mandiName || displayToken.mandiName}
                </span>
              </div>

              {/* Scannable Real QR Code Container */}
              <button
                type="button"
                onClick={() => setShowFullPassModal(true)}
                className="bg-white p-2 rounded-2xl shadow-md shrink-0 text-center hover:ring-2 hover:ring-forest-accent transition-all cursor-pointer group flex flex-col items-center"
                title={language === 'hi' ? 'क्लिक करके बड़ा QR कोड देखें' : 'Click to enlarge QR pass'}
              >
                <div className="w-16 h-16 bg-white flex items-center justify-center p-0.5">
                  <QRCode 
                    value={activeBooking.id || displayToken.id} 
                    size={58} 
                    level="H" 
                  />
                </div>
                <span className="text-[8px] font-bold text-slate-700 block uppercase tracking-tighter mt-1 group-hover:text-forest">
                  {t('scan_at_gate')} 🔍
                </span>
              </button>
            </div>

            {/* Crop & Quantity */}
            <div className="py-3 flex items-center justify-between text-xs border-b border-forest-light/40">
              <div>
                <span className="text-[10px] text-forest-pale block">{t('crop_type')}:</span>
                <strong className="text-sm font-extrabold text-white">{activeBooking.crop || displayToken.crop}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-forest-pale block">{t('quantity')}:</span>
                <strong className="text-sm font-extrabold text-white">
                  {activeBooking.quantity || displayToken.quantityQuintals} {t('quintals')}
                </strong>
              </div>
            </div>

            {/* Live Queue Status Banner */}
            <div className="mt-3 bg-white/10 backdrop-blur rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-gold text-slate-950 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-forest-pale uppercase font-bold block">{t('estimated_wait')}</span>
                  <span className="text-base font-black text-amber-300">
                    {displayToken.estimatedWaitMinutes || 10} {t('minutes')}
                  </span>
                </div>
              </div>

              <div className="text-right border-l border-white/20 pl-3">
                <span className="text-[10px] text-forest-pale uppercase font-bold block">{t('queue_position')}</span>
                <span className="text-xs font-black text-white">
                  {displayToken.queuePosition === 0 ? t('now_at_desk') : `${displayToken.queuePosition || 1} ${t('farmers_ahead')}`}
                </span>
              </div>
            </div>

            <div className="mt-2.5 text-center">
              <span className="text-[11px] text-forest-pale">
                {t('slot_time')}: <strong>{activeBooking.timeSlot || displayToken.scheduledTimeSlot}</strong>
              </span>
            </div>

          </div>

          {/* Dynamic 5-Step Procurement Progress Tracker */}
          <ProcurementTracker 
            bookingId={activeBooking?.id || displayToken?.id}
            status={activeBooking?.status || displayToken?.status}
            farmerId={activeBooking?.farmerId || displayToken?.farmerId}
            tokenId={activeBooking?.id || displayToken?.id}
          />
        </div>
      )}

      {/* Quick Utility Action: Crop Pre-Check (Full-width card, Book Slot moved to Center FAB) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onOpenCropCheck}
          className="w-full p-3.5 bg-white hover:bg-soil-50 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between transition-all active:scale-98 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest-pale text-forest flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <strong className="block text-xs font-black text-slate-900">{t('crop_pre_check')}</strong>
              <span className="text-[11px] text-slate-500 font-medium">{t('test_grain_moisture')}</span>
            </div>
          </div>
          <span className="text-[11px] font-extrabold text-forest bg-forest-pale px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0">
            <span>{language === 'hi' ? 'जांचें' : 'Check'}</span> →
          </span>
        </button>
      </div>

      {/* Full Digital Gate Pass Modal */}
      {showFullPassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 text-slate-900 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-forest uppercase tracking-wider block">
                  {t('digital_pass')} • Gate Entry Pass
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  #{displayToken.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFullPassModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Scannable Large QR Code matching user requirement */}
            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center border border-slate-200 shadow-sm">
              <QRCode 
                value={displayToken.id} // This is the unique ID the officer will scan
                size={170} 
                level="H"
              />
              <span className="text-xs font-bold text-slate-700 mt-3 text-center">
                {language === 'hi' ? 'मंडी गेट पर अधिकारी को यह QR कोड दिखाएं' : 'Show this QR code to Mandi Officer at Gate'}
              </span>
            </div>

            {/* Token Details */}
            <div className="space-y-1.5 text-xs bg-soil-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('crop_type')}:</span>
                <strong className="text-slate-900">{displayToken.crop}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('quantity')}:</span>
                <strong className="text-slate-900">{displayToken.quantityQuintals} {t('quintals')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mandi:</span>
                <strong className="text-forest">{displayToken.mandiName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('slot_time')}:</span>
                <strong className="text-slate-800">{displayToken.scheduledTimeSlot}</strong>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200">
                <span className="text-slate-500">स्थिति (Status):</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  displayToken.status === 'ARRIVED'
                    ? 'bg-purple-100 text-purple-800'
                    : displayToken.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {displayToken.status === 'ARRIVED' ? 'ARRIVED (WAITING)' : displayToken.status}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFullPassModal(false)}
              className="w-full bg-forest hover:bg-forest-light text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95"
            >
              {language === 'hi' ? 'बंद करें (Close)' : 'Done'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
