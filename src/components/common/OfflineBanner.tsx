import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useProcurementStore } from '../../store/useProcurementStore';
import { getTranslation } from '../../i18n/translations';

export const OfflineBanner: React.FC = () => {
  const { isOffline, offlineSyncTime, language, toggleOfflineMode } = useProcurementStore();

  if (!isOffline) return null;

  return (
    <aside aria-label="Offline Mode Notice" className="bg-amber-500 text-slate-950 font-semibold text-xs px-4 py-2 border-b border-amber-600 shadow-inner flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-ping" />
        <WifiOff className="w-4 h-4" />
        <span>
          {getTranslation(language, 'offlineBanner')} {offlineSyncTime}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="bg-slate-950/20 px-2 py-0.5 rounded flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Token & QR Cache Ready
        </span>
        <button
          onClick={toggleOfflineMode}
          className="bg-slate-950 text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
        >
          Go Online
        </button>
      </div>
    </aside>
  );
};
