import React, { useState } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, CheckCircle2, Clock, Truck, Star } from 'lucide-react';
import { MandiCenter } from '../../types';
import { useProcurementStore } from '../../store/useProcurementStore';

interface MandiMapProps {
  onSelectMandi?: (mandi: MandiCenter) => void;
  selectedMandiId?: string;
  showAdminControls?: boolean;
}

export const MandiMap: React.FC<MandiMapProps> = ({ 
  onSelectMandi, 
  selectedMandiId,
  showAdminControls = false
}) => {
  const { mandis } = useProcurementStore();
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

  // SVG Coordinates mapping normalized to a 600x400 viewBox for Gurugram district
  const mandiCoordinates: Record<string, { x: number; y: number }> = {
    'mandi-badshahpur': { x: 330, y: 220 },
    'mandi-sohna': { x: 370, y: 320 },
    'mandi-pataudi': { x: 130, y: 250 },
    'mandi-farrukhnagar': { x: 170, y: 130 },
    'mandi-gurugram-main': { x: 310, y: 140 },
  };

  const farmerFarmLocation = { x: 280, y: 190, name: "Ramesh's Farm (Khandsa)" };

  const getStatusColor = (congestion: string) => {
    switch (congestion) {
      case 'HIGH':
        return { fill: '#ef4444', ring: '#fee2e2', text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' };
      case 'MEDIUM':
        return { fill: '#f59e0b', ring: '#fef3c7', text: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' };
      default:
        return { fill: '#22c55e', ring: '#dcfce7', text: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300' };
    }
  };

  return (
    <div className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-800">
      
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white flex items-center gap-2">
        <Compass className="w-4 h-4 text-forest-accent animate-spin-slow" />
        <span className="text-xs font-bold tracking-tight">Gurugram District APMC Grid</span>
        <span className="text-[10px] bg-forest text-forest-pale px-2 py-0.5 rounded-full font-semibold">
          Live GPS Sync
        </span>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 text-white flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping-subtle" />
          <span>Low Wait (&lt;15m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Medium (15-30m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span>Congested (&gt;30m)</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox="0 0 600 400"
        className="w-full h-[320px] sm:h-[380px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 select-none"
      >
        <defs>
          {/* Subtle Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.4" />
          </pattern>
          {/* Radial glow */}
          <radialGradient id="farmerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#52b788" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#52b788" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Grid lines */}
        <rect width="600" height="400" fill="url(#grid)" />

        {/* District Arterial Highways */}
        <path
          d="M 100 120 Q 300 160 400 350"
          fill="none"
          stroke="#334155"
          strokeWidth="3"
          strokeDasharray="4 4"
        />
        <path
          d="M 150 300 Q 320 200 500 130"
          fill="none"
          stroke="#334155"
          strokeWidth="3"
        />
        <text x="410" y="340" fill="#64748b" fontSize="9" fontWeight="600">Sohna Bypass</text>
        <text x="460" y="125" fill="#64748b" fontSize="9" fontWeight="600">NH-48 Corridor</text>

        {/* Real-time Diversion Path from Badshahpur to Sohna */}
        <path
          d="M 330 220 C 360 250 350 290 370 320"
          fill="none"
          stroke="#52b788"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          className="animate-pulse"
        />
        <text x="365" y="270" fill="#52b788" fontSize="8.5" fontWeight="bold">
          ⚡ AI Load Diversion Route
        </text>

        {/* Farmer Farm Node */}
        <circle cx={farmerFarmLocation.x} cy={farmerFarmLocation.y} r="24" fill="url(#farmerGlow)" />
        <circle cx={farmerFarmLocation.x} cy={farmerFarmLocation.y} r="6" fill="#52b788" stroke="#ffffff" strokeWidth="2" />
        <text
          x={farmerFarmLocation.x}
          y={farmerFarmLocation.y - 12}
          textAnchor="middle"
          fill="#52b788"
          fontSize="10"
          fontWeight="bold"
        >
          📍 Ramesh's Farm
        </text>

        {/* Mandi Nodes */}
        {mandis.map((mandi) => {
          const coords = mandiCoordinates[mandi.id] || { x: 300, y: 200 };
          const colors = getStatusColor(mandi.congestion);
          const isSelected = selectedMandiId === mandi.id;
          const isHovered = activeHoverId === mandi.id;

          return (
            <g
              key={mandi.id}
              className="cursor-pointer transition-transform duration-200"
              onClick={() => onSelectMandi?.(mandi)}
              onMouseEnter={() => setActiveHoverId(mandi.id)}
              onMouseLeave={() => setActiveHoverId(null)}
            >
              {/* Pulsing outer aura for high congested or recommended */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={isHovered || isSelected ? 22 : 16}
                fill={colors.fill}
                opacity={isHovered || isSelected ? 0.35 : 0.2}
                className={mandi.congestion === 'HIGH' ? 'animate-ping' : ''}
              />

              {/* Main Node Circle */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={isHovered || isSelected ? 12 : 9}
                fill={colors.fill}
                stroke="#ffffff"
                strokeWidth={isSelected ? 3 : 2}
              />

              {/* Recommended Star Badge */}
              {mandi.isRecommended && (
                <circle
                  cx={coords.x + 8}
                  cy={coords.y - 8}
                  r="5"
                  fill="#fbbf24"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              )}

              {/* Mandi Title Label */}
              <text
                x={coords.x}
                y={coords.y + 22}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="10"
                fontWeight="bold"
              >
                {mandi.name.replace('APMC Mandi', '').replace('Regional Procurement Yard', '')}
              </text>

              {/* Wait time pill */}
              <text
                x={coords.x}
                y={coords.y + 34}
                textAnchor="middle"
                fill={colors.fill}
                fontSize="8.5"
                fontWeight="bold"
              >
                {mandi.avgWaitMinutes}m wait ({mandi.currentQueueCount} trolleys)
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive Tooltip Card Overlay */}
      {activeHoverId && (
        <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-200 p-3 max-w-[220px] animate-fade-in text-slate-900">
          {(() => {
            const m = mandis.find(item => item.id === activeHoverId);
            if (!m) return null;
            const colors = getStatusColor(m.congestion);
            return (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="font-bold text-slate-900 line-clamp-1">{m.name}</strong>
                  {m.isRecommended && (
                    <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current text-amber-500" /> Best
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Distance:</span>
                  <strong className="text-slate-800">{m.distanceKm} km</strong>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Queue Count:</span>
                  <strong className="text-slate-800">{m.currentQueueCount} / {m.capacityMax} trolleys</strong>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Est. Wait Time:</span>
                  <span className={`font-bold ${colors.text}`}>{m.avgWaitMinutes} mins</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Electronic Scales:</span>
                  <strong className="text-slate-800">{m.activeWeighbridges} active</strong>
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
};
