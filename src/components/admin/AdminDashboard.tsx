import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Users, 
  Building2, 
  BarChart3, 
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Coins,
  Edit3,
  Check,
  AlertCircle
} from 'lucide-react';
import { useProcurementStore } from '../../store/useProcurementStore';
import { getTranslation } from '../../i18n/translations';
import { MandiMap } from '../shared/MandiMap';

interface CropRateItem {
  id: string;
  mandiId: string;
  mandiName?: string;
  cropName: string;
  cropNameHi?: string;
  governmentMsp: number;
  localMandiRate: number;
  updatedAt: string;
}

const GOVT_MSP_REFERENCE: Record<string, number> = {
  'Wheat (Sharbati)': 2275,
  'Mustard (Sarson)': 5650,
  'Gram (Chana)': 5440,
  'Barley (Jau)': 1850,
  'Paddy (Dhan)': 2300
};

export const AdminDashboard: React.FC = () => {
  const { 
    mandis, 
    fraudAlerts, 
    resolveFraudAlert, 
    rebalanceDistrictLoad,
    language 
  } = useProcurementStore();

  const [rebalancedNotice, setRebalancedNotice] = useState(false);

  // Rate Management States
  const [selectedMandiId, setSelectedMandiId] = useState('mandi-badshahpur');
  const [selectedCrop, setSelectedCrop] = useState('Wheat (Sharbati)');
  const [localRateInput, setLocalRateInput] = useState('2300');
  const [rateLoading, setRateLoading] = useState(false);
  const [rateSuccessNotice, setRateSuccessNotice] = useState<string | null>(null);
  const [rateErrorNotice, setRateErrorNotice] = useState<string | null>(null);
  const [liveRatesList, setLiveRatesList] = useState<CropRateItem[]>([]);

  // Fetch current rates
  const fetchLiveRates = async () => {
    try {
      const res = await fetch('/api/rates');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.rates)) {
          setLiveRatesList(data.rates);
        }
      }
    } catch (err) {
      console.warn('Failed to load rates from backend:', err);
    }
  };

  useEffect(() => {
    fetchLiveRates();
  }, []);

  // Sync default input rate when crop or mandi changes
  useEffect(() => {
    const existing = liveRatesList.find(
      (r) => r.mandiId === selectedMandiId && r.cropName === selectedCrop
    );
    if (existing) {
      setLocalRateInput(String(existing.localMandiRate));
    } else {
      const msp = GOVT_MSP_REFERENCE[selectedCrop] || 2275;
      setLocalRateInput(String(msp + 25));
    }
  }, [selectedMandiId, selectedCrop, liveRatesList]);

  const currentGovtMsp = GOVT_MSP_REFERENCE[selectedCrop] || 2275;
  const numericInputRate = Number(localRateInput);
  const isBelowMsp = !isNaN(numericInputRate) && numericInputRate > 0 && numericInputRate < currentGovtMsp;

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateErrorNotice(null);
    setRateSuccessNotice(null);

    if (isBelowMsp) {
      setRateErrorNotice('⚠️ Warning: Local rate cannot be below the Government Minimum Support Price (MSP).');
      return;
    }

    if (isNaN(numericInputRate) || numericInputRate <= 0) {
      setRateErrorNotice('Please enter a valid rate in ₹/Quintal.');
      return;
    }

    setRateLoading(true);

    try {
      const res = await fetch('/api/rates/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mandiId: selectedMandiId,
          cropName: selectedCrop,
          localMandiRate: numericInputRate
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setRateSuccessNotice(`✅ Rate for ${selectedCrop} updated to ₹${numericInputRate}/Qtl and broadcasted in real time!`);
        fetchLiveRates();
        setTimeout(() => setRateSuccessNotice(null), 4500);
      } else {
        setRateErrorNotice(data.error || 'Failed to update crop rate');
      }
    } catch (err) {
      setRateErrorNotice('Network error: Could not reach API backend.');
    } finally {
      setRateLoading(false);
    }
  };

  const handleRebalance = () => {
    rebalanceDistrictLoad();
    setRebalancedNotice(true);
    setTimeout(() => setRebalancedNotice(false), 5000);
  };

  const totalProcuredQuintals = mandis.reduce((sum, m) => sum + m.todaysProcuredQuintals, 0);
  const totalTrolleysInDistrict = mandis.reduce((sum, m) => sum + m.currentQueueCount, 0);

  // Hourly crowd forecast data for the 24-hour surge graph
  const hourlyForecast = [
    { hour: '06:00', load: 15, risk: 'LOW' },
    { hour: '08:00', load: 45, risk: 'LOW' },
    { hour: '10:00', load: 88, risk: 'HIGH', peak: true },
    { hour: '12:00', load: 92, risk: 'CRITICAL', peak: true },
    { hour: '14:00', load: 60, risk: 'MEDIUM' },
    { hour: '16:00', load: 35, risk: 'LOW' },
    { hour: '18:00', load: 20, risk: 'LOW' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      
      {/* Command Center Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-md">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Gurugram District Agricultural Command Center
              </h2>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                District Monitoring Console
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Department of Agriculture & Farmers Welfare • Real-time APMC Mandi Load Balancer
            </p>
          </div>
        </div>

        {/* 1-Click AI Dynamic Load Balancing Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRebalance}
            className="bg-gradient-to-r from-emerald-600 to-forest hover:brightness-110 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-current" />
            <span>{getTranslation(language, 'loadBalanceBtn')}</span>
          </button>
        </div>
      </div>

      {/* Success alert banner when rebalance clicked */}
      {rebalancedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl text-xs text-emerald-950 font-semibold flex items-center justify-between animate-slide-up shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              <strong>AI Load Rebalancing Executed:</strong> 25 pending farmer arrivals dynamically re-routed from Badshahpur APMC to Sohna Procurement Yard. Automated SMS dispatches sent to all 25 drivers.
            </span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
            Wait -53%
          </span>
        </div>
      )}

      {/* NEW FEATURE: Daily Market Rates Management (मंडी भाव सेट करें) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        
        {/* Panel Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Daily Market Rates Management • मंडी भाव सेट करें
              </h3>
              <p className="text-xs text-slate-500">
                Update dynamic mandi benchmark rates. Validated strictly against Govt. MSP.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-forest bg-forest-pale px-3 py-1 rounded-full border border-forest-accent/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live WebSocket Sync Active
          </span>
        </div>

        {/* Rate Update Form */}
        <form onSubmit={handleUpdateRate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          
          {/* Mandi Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Mandi / मंडी केंद्र
            </label>
            <select
              value={selectedMandiId}
              onChange={(e) => setSelectedMandiId(e.target.value)}
              className="w-full bg-soil-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl p-3 focus:ring-2 focus:ring-forest focus:outline-none"
            >
              {mandis.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Crop / फसल
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-soil-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl p-3 focus:ring-2 focus:ring-forest focus:outline-none"
            >
              <option value="Wheat (Sharbati)">Wheat (Sharbati) / गेहूं</option>
              <option value="Mustard (Sarson)">Mustard (Sarson) / सरसों</option>
              <option value="Gram (Chana)">Gram (Chana) / चना</option>
              <option value="Barley (Jau)">Barley (Jau) / जौ</option>
              <option value="Paddy (Dhan)">Paddy (Dhan) / धान</option>
            </select>
          </div>

          {/* Read-Only Government MSP Reference & Local Rate Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Today's Local Rate
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Govt MSP: <strong>₹{currentGovtMsp}</strong>
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-500 font-bold text-sm">₹</span>
              <input
                type="number"
                value={localRateInput}
                onChange={(e) => setLocalRateInput(e.target.value)}
                placeholder={String(currentGovtMsp)}
                className={`w-full bg-soil-50 border font-extrabold text-sm rounded-xl pl-7 pr-16 py-2.5 focus:outline-none focus:ring-2 ${
                  isBelowMsp 
                    ? 'border-red-500 text-red-700 focus:ring-red-400 bg-red-50/50' 
                    : 'border-slate-200 text-slate-900 focus:ring-forest'
                }`}
              />
              <span className="absolute right-3 text-[11px] font-bold text-slate-400">/ Qtl</span>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={rateLoading || isBelowMsp || !localRateInput}
              className="w-full bg-forest hover:bg-forest-light text-white text-xs font-extrabold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
            >
              {rateLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 text-forest-accent" />
                  <span>Update Rate (रेट अपडेट करें)</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Validation Warning Alert (Rendered when local rate is below Govt MSP) */}
        {isBelowMsp && (
          <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake shadow-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              ⚠️ Warning: Local rate (₹{localRateInput}) cannot be below the Government Minimum Support Price (MSP: ₹{currentGovtMsp}).
            </span>
          </div>
        )}

        {/* Success Notice */}
        {rateSuccessNotice && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-slide-up shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{rateSuccessNotice}</span>
          </div>
        )}

        {/* Live District Crop Rates Overview Board */}
        <div className="pt-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
            Active Mandi Bhav Overview (Real-Time Database Feed)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {liveRatesList.slice(0, 4).map((rate) => (
              <div
                key={rate.id}
                className="p-3 bg-soil-50 rounded-2xl border border-slate-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <strong className="font-bold text-slate-900">{rate.cropName}</strong>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                      +₹{rate.localMandiRate - rate.governmentMsp}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    📍 {rate.mandiName || rate.mandiId}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-2 mt-1 border-t border-slate-200/60 text-xs">
                  <span className="text-base font-black text-forest">
                    ₹{rate.localMandiRate}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMandiId(rate.mandiId);
                      setSelectedCrop(rate.cropName);
                      setLocalRateInput(String(rate.localMandiRate));
                    }}
                    className="text-[10px] font-bold text-forest hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Macro Analytics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total Procured Today</span>
            <Building2 className="w-4 h-4 text-forest" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalProcuredQuintals.toLocaleString()} Qtl
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +18.4% vs same period last season
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Active District Queue</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalTrolleysInDistrict} Trolleys
          </div>
          <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
            Across 5 registered mandis
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Average Waiting Time</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-forest">
            18.2 mins
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> Down from 3.5 hrs (Manual era)
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">DBT Disbursed (Direct)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹4.82 Cr
          </div>
          <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
            Zero intermediary cuts
          </span>
        </div>
      </div>

      {/* Middle Grid: District Mandi Telemetry Map & 24H Traffic Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* District Mandi Interactive Map */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                District Mandi Congestion Telemetry Map
              </h3>
              <p className="text-xs text-slate-500">Live geo-spatial queue tracking across procurement terminals</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              5 Terminals Operational
            </span>
          </div>

          {/* Clean Mandi Map Telemetry Component */}
          <MandiMap />

          {/* Footer Legend */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Normal Flow (&lt;10 trolleys)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> High Congestion (&gt;20 trolleys)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">GPS Ping: 3s ago</span>
          </div>
        </div>

        {/* 24-Hour Traffic Surge & AI Capacity Forecast */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-forest" />
                <h3 className="font-extrabold text-sm text-slate-900">24-Hour Influx Forecast</h3>
              </div>
              <span className="text-[10px] font-bold bg-forest-pale text-forest px-2 py-0.5 rounded-full">
                AI Prediction
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Predicted arrival spikes based on harvesting radar telemetry
            </p>

            {/* Simple Visual Forecast Bars */}
            <div className="space-y-2.5">
              {hourlyForecast.map((f, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-600">{f.hour} hrs</span>
                    <span className={f.risk === 'CRITICAL' ? 'text-red-600 font-bold' : f.risk === 'HIGH' ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                      {f.load}% capacity {f.peak && '⚠️ Peak Surge'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-soil-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        f.risk === 'CRITICAL' 
                          ? 'bg-red-500' 
                          : f.risk === 'HIGH' 
                          ? 'bg-amber-500' 
                          : 'bg-forest'
                      }`}
                      style={{ width: `${f.load}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-soil-50 p-3 rounded-2xl border border-slate-100 text-[11px] text-slate-600 mt-4">
            💡 <strong>Advisory:</strong> Pre-emptive load-balancing is recommended prior to the 10:00 AM spike to prevent yard gridlock.
          </div>
        </div>

      </div>

      {/* Fraud Detection & Anomaly Audit Stream */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Land Record & Yield Anomaly Telemetry
              </h3>
              <p className="text-xs text-slate-500">Flagged tokens exceeding yield caps or cross-district land anomalies</p>
            </div>
          </div>
          <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            {fraudAlerts.filter(a => a.status === 'FLAGGED').length} Pending Audits
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fraudAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all ${
                alert.status === 'RESOLVED'
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-red-50/40 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    alert.severity === 'HIGH' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {alert.severity} RISK
                  </span>
                  <strong className="text-xs text-slate-900 font-bold">{alert.farmerName}</strong>
                </div>
                <span className="text-[10px] text-slate-400">{alert.detectedAt}</span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-3">
                {alert.reason}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">
                  ML Confidence: <strong>{alert.confidenceScore}%</strong>
                </span>

                {alert.status === 'RESOLVED' ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                  </span>
                ) : (
                  <button
                    onClick={() => resolveFraudAlert(alert.id)}
                    className="text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl transition-colors shadow-sm"
                  >
                    Resolve Land Audit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
