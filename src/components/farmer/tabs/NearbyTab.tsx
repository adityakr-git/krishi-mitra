import React, { useState } from 'react';
import { Map, List, Compass } from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';
import { NearbyMandisSection } from '../NearbyMandisSection';
import { MandiMap } from '../../shared/MandiMap';

interface NearbyTabProps {
  onSelectMandiForBooking: (mandiId: string) => void;
}

export const NearbyTab: React.FC<NearbyTabProps> = ({ onSelectMandiForBooking }) => {
  const { language } = useTranslation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* View Switcher Header */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 px-2">
          <Compass className="w-4 h-4 text-forest" />
          <span className="text-xs font-extrabold text-slate-800">
            {language === 'hi' ? 'मंडी खोज एवं मैप' : 'Mandi Discovery'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-soil-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-forest shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'सूची (List)' : 'List'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-white text-forest shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'मैप (Map)' : 'Map'}</span>
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {language === 'hi' ? 'जिला मंडी जीपीएस मैप' : 'District Mandi Telemetry Map'}
              </h3>
              <p className="text-[10px] text-slate-500">Live GPS tracking and yard crowding levels</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live GPS
            </span>
          </div>

          <MandiMap />
        </div>
      )}

      {/* List View with Haversine Distance & Smart AI Recommendation */}
      <NearbyMandisSection onSelectMandiForBooking={onSelectMandiForBooking} />

    </div>
  );
};
