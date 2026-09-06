import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';
import { useTranslation } from '../../i18n/useTranslation';
import { useProcurementStore } from '../../store/useProcurementStore';
import { socketService } from '../../services/socketService';

interface ProcurementTrackerProps {
  farmerId?: string;
  tokenId?: string;
  bookingId?: string;
  tokenNumber?: string;
  status?: string;
  className?: string;
  compact?: boolean;
}

// Database status to Step index (1-5) mapping
const statusMap: Record<string, number> = {
  'BOOKED': 1,
  'SCHEDULED': 1,
  'NO_BOOKING': 1,
  'ARRIVED': 2,
  'WAITING': 2,
  'IN_QUEUE': 2,
  'QUALITY_CHECK': 3,
  'INSPECTED': 3,
  'WEIGHED': 4,
  'WEIGHING': 4,
  'PAYMENT_PROCESSING': 4,
  'PAID': 5,
  'COMPLETED': 5
};

export const ProcurementTracker: React.FC<ProcurementTrackerProps> = ({
  farmerId,
  tokenId,
  bookingId,
  tokenNumber,
  status,
  className = '',
  compact = false
}) => {
  const { language } = useTranslation();
  const { activeToken } = useProcurementStore();
  
  const effectiveId = bookingId || tokenNumber || tokenId || activeToken?.id || farmerId || 'A-184';
  const initialStatus = status || activeToken?.status || 'BOOKED';

  const [currentStep, setCurrentStep] = useState<number>(() => {
    return statusMap[initialStatus] || 1;
  });
  const [rawStatus, setRawStatus] = useState<string>(initialStatus);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  // React to status prop changes
  useEffect(() => {
    if (status) {
      setRawStatus(status);
      if (statusMap[status]) {
        setCurrentStep(statusMap[status]);
      }
    }
  }, [status]);

  // 5 Canonical Procurement Steps
  const trackerSteps = [
    { id: 1, labelHi: 'टोकन बना', labelEn: 'Token Generated', descHi: 'स्लॉट बुक हुआ', descEn: 'Slot confirmed' },
    { id: 2, labelHi: 'मंडी आगमन', labelEn: 'Arrived at Mandi', descHi: 'गेट पास स्कैन', descEn: 'Gate scanned' },
    { id: 3, labelHi: 'गुणवत्ता जांच', labelEn: 'Quality Check', descHi: 'नमी व ग्रेडिंग', descEn: 'Moisture & grade' },
    { id: 4, labelHi: 'तौल', labelEn: 'Weighed', descHi: 'धर्मकांटा वजन', descEn: 'Weighbridge record' },
    { id: 5, labelHi: 'भुगतान भेजा', labelEn: 'Payment Sent', descHi: 'DBT सीधे खाते में', descEn: 'Direct DBT to bank' }
  ];

  const fetchStatus = async () => {
    try {
      setIsRefreshing(true);
      const apiUrl = (import.meta as any).env?.VITE_BACKEND_URL || (import.meta as any).env?.VITE_API_URL || API_BASE_URL;
      const res = await fetch(`${apiUrl}/farmer/booking-status/${encodeURIComponent(effectiveId)}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.status && data.status !== 'NO_BOOKING') {
          const stepNum = statusMap[data.status] || 1;
          setCurrentStep(stepNum);
          setRawStatus(data.status);
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch (err) {
      console.warn('[ProcurementTracker] Fetch status error, using local fallback:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load and periodic polling
  useEffect(() => {
    fetchStatus();

    // Poll every 15 seconds for continuous live synchronization
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [effectiveId]);

  // Real-time Socket.io listener for instant cross-device updates
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleUpdate = (data: any) => {
      if (!data) return;
      const idMatches = 
        data.id === effectiveId || 
        data.bookingId === effectiveId || 
        data.farmerId === farmerId ||
        (effectiveId && data.id && String(data.id).toLowerCase().includes(effectiveId.toLowerCase()));

      if (idMatches && data.status) {
        const newStep = statusMap[data.status] || currentStep;
        setCurrentStep(newStep);
        setRawStatus(data.status);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    };

    socket.on('booking_status_updated', handleUpdate);
    socket.on('gate_entry_scanned', handleUpdate);

    return () => {
      socket.off('booking_status_updated', handleUpdate);
      socket.off('gate_entry_scanned', handleUpdate);
    };
  }, [effectiveId, farmerId, currentStep]);

  // Human-friendly token ID formatting (e.g. A-184)
  const displayTokenId = tokenNumber || (bookingId && bookingId.startsWith('A-') ? bookingId : null) || tokenId || (effectiveId && !effectiveId.startsWith('HR-') && effectiveId.length < 20 ? effectiveId : 'A-184');
  const formattedId = displayTokenId.startsWith('#') ? displayTokenId.substring(1) : (
    displayTokenId.startsWith('KM-') || displayTokenId.length > 8 
      ? displayTokenId.substring(0, 6).toUpperCase() 
      : displayTokenId.toUpperCase()
  );

  return (
    <div className={`bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-4 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-forest-pale text-forest flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              {language === 'hi' ? 'खरीद की प्रगति' : 'Procurement Progress'} (#{formattedId})
            </h2>
            <span className="text-[10px] text-slate-400 font-medium">
              {language === 'hi' ? `अंतिम अपडेट: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStatus}
            title={language === 'hi' ? 'ताज़ा करें' : 'Refresh status'}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all ${isRefreshing ? 'animate-spin text-forest' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-black text-forest bg-forest-pale px-2.5 py-1 rounded-full">
            {language === 'hi' ? `चरण ${currentStep} / 5` : `Step ${currentStep} of 5`}
          </span>
        </div>
      </div>

      {/* Progress Bar (Visual Track) */}
      <div className="relative pt-1 pb-1">
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-forest to-amber-500 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* 5 Distinct Step Rows */}
      <div className="space-y-3 pt-1">
        {trackerSteps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isPending = step.id > currentStep;

          const label = language === 'hi' ? step.labelHi : step.labelEn;
          const desc = language === 'hi' ? step.descHi : step.descEn;

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                isCurrent 
                  ? 'bg-amber-50/70 border border-amber-200 shadow-2xs' 
                  : isCompleted 
                  ? 'bg-emerald-50/40 border border-emerald-100' 
                  : 'bg-transparent border border-transparent opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Step Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-forest text-white'
                      : isCurrent
                      ? 'bg-amber-gold text-slate-950 ring-4 ring-amber-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>

                {/* Step Text */}
                <div>
                  <span
                    className={`block text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-amber-950 font-black'
                        : isCompleted
                        ? 'text-forest font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                  {!compact && (
                    <span className="text-[10px] text-slate-500 leading-none">
                      {desc}
                    </span>
                  )}
                </div>
              </div>

              {/* Step Badges */}
              <div>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full animate-pulse-subtle">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                    {language === 'hi' ? 'प्रगति पर' : 'In Progress'}
                  </span>
                )}
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {language === 'hi' ? 'सफल' : 'Done'}
                  </span>
                )}
                {isPending && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    {language === 'hi' ? 'प्रतीक्षारत' : 'Pending'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info / Security Badge */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1 text-forest font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          {language === 'hi' ? 'सीधे सरकारी बैंक DBT सुरक्षित' : 'PFMS/DBT Direct Verified'}
        </span>
        <span className="text-[10px] text-slate-400">
          Status: <strong className="text-slate-700 font-mono uppercase">{rawStatus}</strong>
        </span>
      </div>
    </div>
  );
};
