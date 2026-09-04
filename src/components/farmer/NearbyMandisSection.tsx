import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Sparkles, 
  Clock, 
  Calendar, 
  Compass, 
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useProcurementStore } from '../../store/useProcurementStore';
import { useTranslation } from '../../i18n/useTranslation';
import { 
  DEFAULT_FARMER_COORDS, 
  computeNearbyMandisWithSmartMitra, 
  MandiDistanceItem 
} from '../../utils/geoDistance';

interface NearbyMandisSectionProps {
  onSelectMandiForBooking: (mandiId: string) => void;
}

export const NearbyMandisSection: React.FC<NearbyMandisSectionProps> = ({ 
  onSelectMandiForBooking 
}) => {
  const { mandis } = useProcurementStore();
  const { t, language } = useTranslation();

  const [coords, setCoords] = useState({
    latitude: DEFAULT_FARMER_COORDS.latitude,
    longitude: DEFAULT_FARMER_COORDS.longitude
  });

  const [locationSource, setLocationSource] = useState<'GPS' | 'VILLAGE'>('VILLAGE');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // Request browser geolocation with fallback to village coordinates
  const requestGpsLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationSource('VILLAGE');
      return;
    }

    setLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationSource('GPS');
        setLocating(false);
      },
      (error) => {
        console.warn('[Geolocation] GPS access denied or timed out, using village profile fallback:', error.message);
        setLocationSource('VILLAGE');
        setGpsError('GPS permission denied. Showing distances from your registered village (Khandsa).');
        setLocating(false);
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    requestGpsLocation();
  }, []);

  // Compute distances & Smart AI recommendation
  const { sortedMandis, smartRecommendation } = computeNearbyMandisWithSmartMitra(
    mandis,
    coords.latitude,
    coords.longitude
  );

  const openGoogleMapsDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${coords.latitude},${coords.longitude}&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
      
      {/* Section Header & Location Status */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-forest-pale text-forest flex items-center justify-center font-bold">
            <Compass className="w-4 h-4 text-forest" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === 'hi' ? 'आपके आस-पास की मंडियां' : 'Nearby Procurement Centers (Mandis)'}
            </h2>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${locationSource === 'GPS' ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
              {locationSource === 'GPS'
                ? (language === 'hi' ? 'लाइव जीपीएस सक्रिय (सटीक दूरी)' : 'Live GPS Active (Accurate Distances)')
                : (language === 'hi' ? 'पंजीकृत गांव: खांडसा, गुरुग्राम' : 'Registered Village: Khandsa, Gurugram')}
            </span>
          </div>
        </div>

        {locationSource === 'VILLAGE' && (
          <button
            onClick={requestGpsLocation}
            disabled={locating}
            className="text-[10px] font-extrabold text-forest bg-forest-pale hover:bg-forest hover:text-white px-2.5 py-1 rounded-full border border-forest-accent/30 transition-all"
          >
            {locating ? 'खोज रहे हैं...' : 'Use GPS'}
          </button>
        )}
      </div>

      {/* Feature 4: Smart AI Recommendation ("The Mitra Feature") */}
      {smartRecommendation && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2 relative overflow-hidden shadow-xs animate-slide-up">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-700 fill-current" />
              <span>{language === 'hi' ? 'कृषि मित्र स्मार्ट सुझाव' : 'Krishi Mitra Smart Suggestion'}</span>
            </span>
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3 text-emerald-600" />
              <span>
                {language === 'hi' 
                  ? `बचत: ~${smartRecommendation.recommendationReason?.savedMinutes} मिनट` 
                  : `Save ~${smartRecommendation.recommendationReason?.savedMinutes} mins`}
              </span>
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <strong className="text-xs font-black text-slate-900 block">
                {smartRecommendation.name}
              </strong>
              <p className="text-[11px] text-slate-700 font-medium leading-tight mt-0.5">
                {language === 'hi'
                  ? smartRecommendation.recommendationReason?.hi
                  : smartRecommendation.recommendationReason?.en}
              </p>
            </div>
            <button
              onClick={() => onSelectMandiForBooking(smartRecommendation.id)}
              className="bg-forest hover:bg-forest-light text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl shrink-0 shadow-sm transition-all active:scale-95"
            >
              {language === 'hi' ? 'यहाँ स्लॉट बुक करें' : 'Book Here'}
            </button>
          </div>
        </div>
      )}

      {/* Sorted List of Mandi Cards (Closest First) */}
      <div className="space-y-2.5">
        {sortedMandis.map((mandi, idx) => {
          // Crowd status calculation
          const isLow = mandi.currentQueueCount < 10;
          const isMedium = mandi.currentQueueCount >= 10 && mandi.currentQueueCount <= 20;
          const isHigh = mandi.currentQueueCount > 20;

          const crowdBadge = isLow
            ? { labelEn: 'Low Crowd', labelHi: 'कम भीड़', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
            : isMedium
            ? { labelEn: 'Moderate', labelHi: 'सामान्य भीड़', bg: 'bg-amber-100 text-amber-900 border-amber-300' }
            : { labelEn: 'Heavy Rush', labelHi: 'अधिक भीड़', bg: 'bg-red-100 text-red-800 border-red-300' };

          return (
            <div
              key={mandi.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                mandi.isSmartRecommendation
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-soil-50 border-slate-100'
              }`}
            >
              {/* Row 1: Name, Distance & Crowd Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-extrabold text-slate-900">
                      {mandi.name}
                    </strong>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded-full">
                        {language === 'hi' ? 'सबसे पास' : 'Closest'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-forest flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-forest-accent" />
                    <span>📍 {mandi.calculatedDistanceKm} km {t('km_away')}</span>
                  </span>
                </div>

                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${crowdBadge.bg}`}>
                  {language === 'hi' ? crowdBadge.labelHi : crowdBadge.labelEn}
                </span>
              </div>

              {/* Row 2: Queue metrics */}
              <div className="flex items-center justify-between text-xs py-2 my-1 border-y border-slate-200/60">
                <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {language === 'hi' ? 'प्रतीक्षा समय:' : 'Est. Wait:'}{' '}
                    <strong className={mandi.avgWaitMinutes > 30 ? 'text-red-600' : 'text-forest'}>
                      {mandi.avgWaitMinutes} {t('minutes')}
                    </strong>
                  </span>
                </div>

                <span className="text-[11px] text-slate-500">
                  <strong>{mandi.currentQueueCount}</strong> {t('trolleys')} in yard
                </span>
              </div>

              {/* Row 3: Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openGoogleMapsDirections(mandi.lat, mandi.lng)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition-colors shadow-2xs active:scale-98"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'hi' ? 'रास्ता देखें (GPS)' : 'Get Directions'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectMandiForBooking(mandi.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-extrabold shadow-sm transition-all active:scale-98"
                >
                  <Calendar className="w-3.5 h-3.5 text-forest-accent" />
                  <span>{language === 'hi' ? 'स्लॉट बुक करें' : 'Book Slot'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
