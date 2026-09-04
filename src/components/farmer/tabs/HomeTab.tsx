import React from 'react';
import { 
  Clock, 
  MapPin, 
  Plus, 
  Camera, 
  Radio, 
  WifiOff,
  Ticket
} from 'lucide-react';
import { Token } from '../../../types';
import { useTranslation } from '../../../i18n/useTranslation';
import { MandiBhavTicker } from '../MandiBhavTicker';
import { WeatherAdvisoryWidget } from '../WeatherAdvisoryWidget';

interface HomeTabProps {
  farmerName: string;
  displayToken: Token;
  isEffectivelyOffline: boolean;
  liveSyncNotice: string | null;
  onOpenCropCheck: () => void;
  onOpenBookModal: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  farmerName,
  displayToken,
  isEffectivelyOffline,
  liveSyncNotice,
  onOpenCropCheck,
  onOpenBookModal
}) => {
  const { t, language } = useTranslation();

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
              #{displayToken.id}
            </span>
            <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-forest-accent" />
              {displayToken.mandiName}
            </span>
          </div>

          {/* Scannable QR Code Container */}
          <div className="bg-white p-2 rounded-2xl shadow-md shrink-0 text-center">
            <div className="w-16 h-16 bg-white flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                <rect width="100" height="100" fill="white" />
                <rect x="10" y="10" width="26" height="26" fill="#1b4332" rx="4" />
                <rect x="16" y="16" width="14" height="14" fill="white" rx="2" />
                <rect x="20" y="20" width="6" height="6" fill="#1b4332" />
                
                <rect x="64" y="10" width="26" height="26" fill="#1b4332" rx="4" />
                <rect x="70" y="16" width="14" height="14" fill="white" rx="2" />
                <rect x="74" y="20" width="6" height="6" fill="#1b4332" />

                <rect x="10" y="64" width="26" height="26" fill="#1b4332" rx="4" />
                <rect x="16" y="70" width="14" height="14" fill="white" rx="2" />
                <rect x="20" y="74" width="6" height="6" fill="#1b4332" />

                <rect x="42" y="14" width="6" height="6" fill="#1b4332" />
                <rect x="52" y="22" width="6" height="6" fill="#1b4332" />
                <rect x="42" y="32" width="16" height="6" fill="#1b4332" />
                <rect x="42" y="52" width="6" height="16" fill="#1b4332" />
                <rect x="56" y="62" width="8" height="8" fill="#1b4332" />
                <rect x="74" y="52" width="14" height="6" fill="#1b4332" />
              </svg>
            </div>
            <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-tighter mt-0.5">
              {t('scan_at_gate')}
            </span>
          </div>
        </div>

        {/* Crop & Quantity */}
        <div className="py-3 flex items-center justify-between text-xs border-b border-forest-light/40">
          <div>
            <span className="text-[10px] text-forest-pale block">{t('crop_type')}:</span>
            <strong className="text-sm font-extrabold text-white">{displayToken.crop}</strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-forest-pale block">{t('quantity')}:</span>
            <strong className="text-sm font-extrabold text-white">
              {displayToken.quantityQuintals} {t('quintals')}
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
                {displayToken.estimatedWaitMinutes} {t('minutes')}
              </span>
            </div>
          </div>

          <div className="text-right border-l border-white/20 pl-3">
            <span className="text-[10px] text-forest-pale uppercase font-bold block">{t('queue_position')}</span>
            <span className="text-xs font-black text-white">
              {displayToken.queuePosition === 0 ? t('now_at_desk') : `${displayToken.queuePosition} ${t('farmers_ahead')}`}
            </span>
          </div>
        </div>

        <div className="mt-2.5 text-center">
          <span className="text-[11px] text-forest-pale">
            {t('slot_time')}: <strong>{displayToken.scheduledTimeSlot}</strong>
          </span>
        </div>

      </div>

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

    </div>
  );
};
