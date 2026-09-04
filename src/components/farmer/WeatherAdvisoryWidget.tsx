import React from 'react';
import { Sun, Wind, Droplets, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

export const WeatherAdvisoryWidget: React.FC = () => {
  const { t, language } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-white to-sky-50/50 rounded-3xl p-4 shadow-sm border border-amber-200/80 space-y-3">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center font-bold">
            <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('weather_title')}
            </h3>
            <span className="text-[10px] text-slate-500">
              {language === 'hi' ? 'गुरुग्राम जिला मौसम पूर्वानुमान' : 'Gurugram District Agricultural Forecast'}
            </span>
          </div>
        </div>

        <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
          ☀️ 32°C
        </span>
      </div>

      {/* Atmospheric Indicators */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 bg-white/80 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 block">
            {language === 'hi' ? 'आसमान' : 'Sky'}
          </span>
          <strong className="text-xs font-extrabold text-slate-800">
            {language === 'hi' ? 'साफ धूप' : 'Clear'}
          </strong>
        </div>

        <div className="p-2 bg-white/80 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
            <Droplets className="w-3 h-3 text-blue-500" /> {language === 'hi' ? 'नमी' : 'Humidity'}
          </span>
          <strong className="text-xs font-extrabold text-slate-800">42%</strong>
        </div>

        <div className="p-2 bg-white/80 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
            <Wind className="w-3 h-3 text-teal-500" /> {language === 'hi' ? 'हवा' : 'Wind'}
          </span>
          <strong className="text-xs font-extrabold text-slate-800">12 km/h</strong>
        </div>
      </div>

      {/* Smart Farmer Advisory Banner */}
      <div className="bg-emerald-50/90 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-950 font-semibold flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t('weather_advisory')}
        </p>
      </div>

    </div>
  );
};
