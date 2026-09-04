import React, { useState } from 'react';
import { 
  Building2, 
  Megaphone, 
  CheckCircle, 
  Clock, 
  Truck, 
  Scale, 
  FileCheck, 
  CreditCard, 
  ArrowRight, 
  Search, 
  SlidersHorizontal,
  Send,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProcurementStore } from '../../store/useProcurementStore';
import { getTranslation } from '../../i18n/translations';
import { Token } from '../../types';

export const OfficerDashboard: React.FC = () => {
  const { 
    allTokens, 
    mandis, 
    language,
    advanceActiveTokenQueue,
    markTokenArrived,
    recordQualityAndWeighing,
    approvePayment,
    broadcastOfficerAlert
  } = useProcurementStore();

  const [filterTab, setFilterTab] = useState<'ALL' | 'WAITING' | 'PROCESSING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Selected Token for Weighing & Inspection Modal
  const [inspectingToken, setInspectingToken] = useState<Token | null>(null);
  const [moistureInput, setMoistureInput] = useState<number>(11.4);
  const [gradeInput, setGradeInput] = useState<'Grade A' | 'Grade B' | 'Grade C'>('Grade A');
  const [netWeightQuintals, setNetWeightQuintals] = useState<number>(40.0);

  const activeMandi = mandis[0]; // Badshahpur Mandi

  const filteredTokens = allTokens.filter((token) => {
    const matchesSearch = 
      token.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.crop.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'WAITING') return token.status === 'SCHEDULED' || token.status === 'ARRIVED';
    if (filterTab === 'PROCESSING') return token.status === 'QUALITY_CHECK' || token.status === 'WEIGHING' || token.status === 'PAYMENT_PROCESSING';
    if (filterTab === 'COMPLETED') return token.status === 'COMPLETED';
    return true;
  });

  const handleCallNext = async () => {
    // 1. Advance local state
    advanceActiveTokenQueue();

    // 2. Call backend PUT /api/queue/next to advance database and emit Socket.io broadcast
    try {
      await fetch('/api/queue/next', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandiId: activeMandi.id })
      });
    } catch (err) {
      console.warn('[Officer Console] Backend queue update failed, using local broadcast:', err);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    broadcastOfficerAlert(broadcastMsg.trim());
    setBroadcastSent(true);
    setBroadcastMsg('');
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const handleCompleteInspection = () => {
    if (!inspectingToken) return;
    recordQualityAndWeighing(inspectingToken.id, moistureInput, gradeInput, netWeightQuintals);
    setInspectingToken(null);
  };

  const handleTriggerPayment = (tokenId: string) => {
    approvePayment(tokenId);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      
      {/* Mandi Terminal Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-forest text-forest-pale flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {activeMandi.name} — Terminal Bay #2
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Officer Console Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Procuring Officer: <strong>S.P. Varma (Badge #409)</strong> • Weighbridges Online: 2 of 3
            </p>
          </div>
        </div>

        {/* Rapid Call Next Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCallNext}
            className="bg-forest hover:bg-forest-light text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Megaphone className="w-4 h-4 text-forest-accent" />
            <span>{getTranslation(language, 'callNext')}</span>
          </button>
        </div>
      </div>

      {/* Key Mandi Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 block font-medium">Trolleys in Yard</span>
          <span className="text-2xl font-black text-slate-900">{activeMandi.currentQueueCount}</span>
          <span className="text-[10px] text-slate-400 block">Cap: {activeMandi.capacityMax} Max</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 block font-medium">Avg Processing Velocity</span>
          <span className="text-2xl font-black text-forest">6.0 m</span>
          <span className="text-[10px] text-emerald-600 block font-semibold">Per Electronic Scale</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 block font-medium">Today Procured</span>
          <span className="text-2xl font-black text-slate-900">{activeMandi.todaysProcuredQuintals} Qtl</span>
          <span className="text-[10px] text-slate-400 block">Wheat & Mustard</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 block font-medium">DBT Approval Rate</span>
          <span className="text-2xl font-black text-emerald-700">100%</span>
          <span className="text-[10px] text-emerald-600 block font-semibold">Zero Cash Disputes</span>
        </div>
      </div>

      {/* Main Queue Management Section */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        
        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* Tab Filters */}
          <div className="flex items-center gap-1 bg-soil-100 p-1 rounded-xl">
            {(['ALL', 'WAITING', 'PROCESSING', 'COMPLETED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farmer, token, crop..."
              className="w-full bg-soil-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
          </div>

        </div>

        {/* Tokens Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-soil-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Token ID</th>
                <th className="py-3 px-3">Farmer & Kisan ID</th>
                <th className="py-3 px-3">Crop / Qtl</th>
                <th className="py-3 px-3">Slot Time</th>
                <th className="py-3 px-3">Queue Pos</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Rapid Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTokens.map((token) => {
                const isHero = token.id === 'A-142';

                return (
                  <tr
                    key={token.id}
                    className={`hover:bg-soil-50/80 transition-colors ${
                      isHero ? 'bg-forest-pale/20 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-slate-900 text-sm">
                        #{token.id}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div>
                        <strong className="text-slate-900 block">{token.farmerName}</strong>
                        <span className="text-[10px] text-slate-400">{token.farmerId}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div>
                        <span className="text-slate-800 block">{token.crop}</span>
                        <strong className="text-forest text-xs">{token.quantityQuintals} Qtl</strong>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {token.scheduledTimeSlot}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        token.queuePosition === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : token.queuePosition <= 2
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {token.queuePosition === 0 ? 'At Desk' : `#${token.queuePosition}`}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-tight ${
                        token.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : token.status === 'PAYMENT_PROCESSING'
                          ? 'bg-blue-100 text-blue-800'
                          : token.status === 'ARRIVED'
                          ? 'bg-purple-100 text-purple-800'
                          : token.status === 'WEIGHING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {token.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {token.status === 'SCHEDULED' && (
                        <button
                          onClick={() => markTokenArrived(token.id)}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                        >
                          Mark Arrived
                        </button>
                      )}

                      {token.status === 'ARRIVED' && (
                        <button
                          onClick={() => {
                            setInspectingToken(token);
                            setNetWeightQuintals(token.quantityQuintals);
                          }}
                          className="bg-forest hover:bg-forest-light text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors shadow-sm"
                        >
                          Start Weigh & Inspect
                        </button>
                      )}

                      {token.status === 'PAYMENT_PROCESSING' && (
                        <button
                          onClick={() => handleTriggerPayment(token.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors shadow-sm flex items-center gap-1 ml-auto"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Approve DBT (₹{(token.paymentData?.netAmount || 91000).toLocaleString('en-IN')})</span>
                        </button>
                      )}

                      {token.status === 'COMPLETED' && (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>DBT Paid</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Mandi Broadcast Alert Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-5 h-5 text-amber-gold" />
          <h3 className="font-extrabold text-sm text-slate-900">
            {getTranslation(language, 'broadcastAlert')}
          </h3>
        </div>
        <form onSubmit={handleBroadcast} className="flex gap-2">
          <input
            type="text"
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="Broadcast live message to all scheduled farmers (e.g. Weighbridge #2 open, proceed to gate #1)..."
            className="flex-1 bg-soil-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest"
          />
          <button
            type="submit"
            className="bg-forest hover:bg-forest-light text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Alert</span>
          </button>
        </form>
        {broadcastSent && (
          <p className="text-[11px] text-emerald-600 font-semibold mt-2 animate-fade-in flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Broadcast alert delivered to all active farmer queues!
          </p>
        )}
      </div>

      {/* Inspection & Weighbridge Modal */}
      {inspectingToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-forest text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Procurement Inspection Station — Token #{inspectingToken.id}
                </h3>
                <p className="text-xs text-forest-pale">
                  Farmer: {inspectingToken.farmerName} • Crop: {inspectingToken.crop}
                </p>
              </div>
              <button
                onClick={() => setInspectingToken(null)}
                className="text-forest-pale hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              {/* Quality Inspection */}
              <div className="space-y-3 bg-soil-50 p-3.5 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-forest" /> 1. Quality & Moisture Calibration
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Moisture Reading (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={moistureInput}
                      onChange={(e) => setMoistureInput(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 font-bold bg-white"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Govt Limit: 12.0%</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Quality Grade</label>
                    <select
                      value={gradeInput}
                      onChange={(e) => setGradeInput(e.target.value as any)}
                      className="w-full p-2 rounded-xl border border-slate-200 font-bold bg-white"
                    >
                      <option value="Grade A">Grade A (Premium FAQ)</option>
                      <option value="Grade B">Grade B (Standard)</option>
                      <option value="Grade C">Grade C (Industrial)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Electronic Weighbridge */}
              <div className="space-y-3 bg-soil-50 p-3.5 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-600" /> 2. Electronic Weighbridge Scale #2
                </h4>

                <div>
                  <label className="block text-slate-600 mb-1">Net Weight (Quintals)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={netWeightQuintals}
                    onChange={(e) => setNetWeightQuintals(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold bg-white text-base text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Gross: {1420 + netWeightQuintals * 100} kg • Tare: 1420 kg
                  </span>
                </div>

                {/* Auto Calculated MSP Summary */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>MSP Rate:</span>
                    <span>₹2,275 / Qtl</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm border-t border-emerald-200 pt-1">
                    <span>Payable via Direct DBT:</span>
                    <span className="text-forest text-base font-black">
                      ₹{Math.round(netWeightQuintals * 2275).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingToken(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteInspection}
                  className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-bold shadow-md"
                >
                  Save & Advance to Payment Approval
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
