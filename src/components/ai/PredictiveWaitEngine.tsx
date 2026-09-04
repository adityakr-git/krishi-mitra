import React, { useState } from 'react';
import { 
  Clock, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  Truck, 
  Gauge, 
  CloudSun, 
  Info 
} from 'lucide-react';
import { useProcurementStore } from '../../store/useProcurementStore';

export const PredictiveWaitEngine: React.FC = () => {
  const { activeToken, aiWaitFactors } = useProcurementStore();
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-forest-pale text-forest flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Predictive Wait Time
            </h4>
            <p className="text-[11px] text-slate-500">AI Real-time Throughput Model</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-200">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>{aiWaitFactors.confidenceScore}% Confidence</span>
        </div>
      </div>

      {/* Main Countdown Display */}
      <div className="flex items-baseline justify-between py-2 border-y border-slate-100 my-2">
        <div>
          <span className="text-3xl sm:text-4xl font-black text-forest">
            {activeToken.estimatedWaitMinutes}
          </span>
          <span className="text-sm font-semibold text-slate-500 ml-1.5">minutes</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-700 block">
            Position #{activeToken.queuePosition}
          </span>
          <span className="text-[10px] text-slate-500">
            {activeToken.queuePosition === 0 ? 'Now at Inspection' : `${activeToken.queuePosition} trolleys ahead`}
          </span>
        </div>
      </div>

      {/* Expandable Explanation Button */}
      <button
        onClick={() => setShowExplanation(!showExplanation)}
        className="w-full flex items-center justify-between text-xs font-semibold text-forest hover:text-forest-light py-1 transition-colors"
      >
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5" /> Explainable AI Prediction Factors
        </span>
        {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Explanatory breakdown */}
      {showExplanation && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2 text-[11px] text-slate-600 animate-slide-up">
          <div className="flex items-center justify-between bg-soil-50 p-2 rounded-lg">
            <span className="flex items-center gap-1.5 font-medium">
              <Truck className="w-3.5 h-3.5 text-forest" /> Trolleys in Queue:
            </span>
            <strong className="text-slate-900">{aiWaitFactors.totalTrolleysAhead} ahead</strong>
          </div>

          <div className="flex items-center justify-between bg-soil-50 p-2 rounded-lg">
            <span className="flex items-center gap-1.5 font-medium">
              <Gauge className="w-3.5 h-3.5 text-blue-600" /> Active Electronic Scales:
            </span>
            <strong className="text-slate-900">2 / 3 Operational</strong>
          </div>

          <div className="flex items-center justify-between bg-soil-50 p-2 rounded-lg">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-amber-600" /> Avg Scale Clearance:
            </span>
            <strong className="text-slate-900">{aiWaitFactors.processingSpeedMins} mins/trolley</strong>
          </div>

          <div className="flex items-center justify-between bg-soil-50 p-2 rounded-lg">
            <span className="flex items-center gap-1.5 font-medium">
              <CloudSun className="w-3.5 h-3.5 text-emerald-600" /> Weather & Route:
            </span>
            <strong className="text-slate-900">{aiWaitFactors.weatherFactor}</strong>
          </div>

          <div className="text-[10px] text-slate-400 italic pt-1">
            *Formula: Wait = (TrolleysAhead × ProcessingSpeed) / ActiveWeighbridges × WeatherCoefficient
          </div>
        </div>
      )}

    </div>
  );
};
