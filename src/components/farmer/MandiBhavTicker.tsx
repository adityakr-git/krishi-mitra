import React, { useState, useEffect } from 'react';
import { TrendingUp, Coins, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { socketService } from '../../services/socketService';

export interface LiveCropRate {
  id: string;
  mandiId: string;
  mandiName?: string;
  cropName: string;
  cropNameHi?: string;
  governmentMsp: number;
  localMandiRate: number;
  updatedAt: string;
}

const DEFAULT_RATES: LiveCropRate[] = [
  {
    id: 'rate_badshahpur_wheat',
    mandiId: 'mandi-badshahpur',
    mandiName: 'Badshahpur APMC Mandi',
    cropName: 'Wheat (Sharbati)',
    cropNameHi: 'गेहूं (शरबती)',
    governmentMsp: 2275,
    localMandiRate: 2300,
    updatedAt: 'Today, 08:30 AM'
  },
  {
    id: 'rate_sohna_mustard',
    mandiId: 'mandi-sohna',
    mandiName: 'Sohna Procurement Yard',
    cropName: 'Mustard (Sarson)',
    cropNameHi: 'सरसों (देशी)',
    governmentMsp: 5650,
    localMandiRate: 5720,
    updatedAt: 'Today, 08:30 AM'
  },
  {
    id: 'rate_pataudi_gram',
    mandiId: 'mandi-pataudi',
    mandiName: 'Pataudi Sub-Tehsil Mandi',
    cropName: 'Gram (Chana)',
    cropNameHi: 'चना (देसी)',
    governmentMsp: 5440,
    localMandiRate: 5480,
    updatedAt: 'Today, 08:30 AM'
  },
  {
    id: 'rate_badshahpur_barley',
    mandiId: 'mandi-badshahpur',
    mandiName: 'Badshahpur APMC Mandi',
    cropName: 'Barley (Jau)',
    cropNameHi: 'जौ',
    governmentMsp: 1850,
    localMandiRate: 1880,
    updatedAt: 'Today, 08:30 AM'
  }
];

export const MandiBhavTicker: React.FC = () => {
  const { t, language } = useTranslation();
  const [rates, setRates] = useState<LiveCropRate[]>(DEFAULT_RATES);
  const [recentlyUpdatedCrop, setRecentlyUpdatedCrop] = useState<string | null>(null);

  // 1. Fetch current dynamic rates from backend API
  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.rates) && data.rates.length > 0) {
          // Take top 4 distinct crops for high-priority farmer view
          setRates(data.rates.slice(0, 4));
        }
      }
    } catch (err) {
      console.warn('[MandiBhavTicker] Failed to fetch live rates, using cached defaults:', err);
    }
  };

  useEffect(() => {
    fetchRates();

    // 2. Real-Time WebSocket Listener for rate_updated event
    const handleRateUpdate = (data: any) => {
      console.log('[MandiBhavTicker] Real-Time rate update received:', data);
      
      setRecentlyUpdatedCrop(data.cropName);
      setTimeout(() => setRecentlyUpdatedCrop(null), 3500);

      // Refresh rate table from broadcast data
      if (data.allRates && Array.isArray(data.allRates)) {
        setRates(data.allRates.slice(0, 4));
      } else {
        setRates((prev) =>
          prev.map((r) =>
            r.cropName === data.cropName && r.mandiId === data.mandiId
              ? { ...r, localMandiRate: data.localMandiRate, updatedAt: data.updatedAt }
              : r
          )
        );
      }
    };

    socketService.onRateUpdated(handleRateUpdate);

    return () => {
      socketService.off('rate_updated');
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('mandi_bhav_title')}
            </h3>
            <span className="text-[10px] text-slate-400">
              {language === 'hi' ? 'लाइव सरकारी एमएसपी एवं दैनिक मंडी दर' : 'Live MSP vs Today\'s Local Mandi Rates'}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>{language === 'hi' ? 'मंडी में ऊँचे भाव' : 'Premium Rates'}</span>
        </span>
      </div>

      {/* Grid of Dynamic Mandi Rates */}
      <div className="grid grid-cols-2 gap-2">
        {rates.map((crop) => {
          const diff = crop.localMandiRate - crop.governmentMsp;
          const isJustUpdated = recentlyUpdatedCrop === crop.cropName;

          return (
            <div
              key={`${crop.mandiId}-${crop.cropName}`}
              className={`p-3 rounded-2xl border transition-all duration-300 space-y-1.5 ${
                isJustUpdated 
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 scale-[1.02]' 
                  : 'bg-soil-50 border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-slate-900 block truncate">
                  {language === 'hi' && crop.cropNameHi ? crop.cropNameHi : crop.cropName}
                </strong>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded-full flex items-center shrink-0">
                  +₹{diff}
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs pt-0.5">
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('current_mandi_rate')}</span>
                  <span className="text-sm font-black text-forest flex items-center gap-1">
                    ₹{crop.localMandiRate.toLocaleString()}
                    {isJustUpdated && <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">{t('msp_benchmark')}</span>
                  <span className="text-xs font-semibold text-slate-600">₹{crop.governmentMsp.toLocaleString()}</span>
                </div>
              </div>

              {/* Mandi Name & "Last Updated" timestamp to build farmer trust */}
              <div className="border-t border-slate-200/60 pt-1 flex items-center justify-between text-[9px] text-slate-400">
                <span className="truncate max-w-[55%]">📍 {crop.mandiName || crop.mandiId}</span>
                <span className="flex items-center gap-0.5 font-medium text-slate-500 shrink-0">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{crop.updatedAt || 'Today, 08:30 AM'}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
