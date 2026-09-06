import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Megaphone, 
  CheckCircle, 
  CheckCircle2,
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
  AlertCircle,
  UserCheck,
  FileText,
  Eye,
  X,
  ExternalLink,
  ShieldCheck,
  Camera,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProcurementStore } from '../../store/useProcurementStore';
import { getTranslation } from '../../i18n/translations';
import { Token } from '../../types';
import { getApiUrl, API_BASE_URL } from '../../utils/api';
import { playSuccessChime } from '../../utils/soundEffects';
import { RegisteredFarmer } from '../auth/LoginView';
import { QRScanner } from './QRScanner';

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

  // Section Switcher: Mandi Yard Operations vs Farmer KYC Verification vs QR Scanner
  const [dashboardSection, setDashboardSection] = useState<'OPERATIONS' | 'KYC' | 'SCANNER'>('KYC');
  const [registeredFarmers, setRegisteredFarmers] = useState<RegisteredFarmer[]>([]);
  const [selectedDocFarmer, setSelectedDocFarmer] = useState<RegisteredFarmer | null>(null);
  const [kycTab, setKycTab] = useState<'PENDING' | 'APPROVED'>('PENDING');

  const loadRegisteredFarmers = async () => {
    try {
      // 1. Fetch pending & approved directly from Neon Backend API
      const [pendingRes, approvedRes] = await Promise.all([
        fetch(getApiUrl('/api/officer/pending-kyc')),
        fetch(getApiUrl('/api/officer/approved-kyc'))
      ]);

      if (pendingRes.ok && approvedRes.ok) {
        const pendingData: RegisteredFarmer[] = await pendingRes.json();
        const approvedData: RegisteredFarmer[] = await approvedRes.json();
        const combined: RegisteredFarmer[] = [...pendingData, ...approvedData];
        if (combined.length > 0) {
          setRegisteredFarmers(combined);
          localStorage.setItem('registered_farmers', JSON.stringify(combined));
          return;
        }
      }
    } catch (err) {
      console.warn('Backend KYC fetch error, using local fallback:', err);
    }

    try {
      const data: RegisteredFarmer[] = JSON.parse(localStorage.getItem('registered_farmers') || '[]');
      setRegisteredFarmers(data);
    } catch {
      setRegisteredFarmers([]);
    }
  };

  React.useEffect(() => {
    loadRegisteredFarmers();
    window.addEventListener('registered_farmers_updated', loadRegisteredFarmers);
    window.addEventListener('storage', loadRegisteredFarmers);
    return () => {
      window.removeEventListener('registered_farmers_updated', loadRegisteredFarmers);
      window.removeEventListener('storage', loadRegisteredFarmers);
    };
  }, []);

  const pendingFarmers = registeredFarmers.filter(f => f.status === 'pending');
  const approvedFarmers = registeredFarmers.filter(f => f.status === 'approved');

  // 4. Officer Approval Action per requirement specification with Neon Backend
  const handleApproveFarmer = async (farmerIdentifier: string) => {
    const farmer = registeredFarmers.find(f => f.phone === farmerIdentifier || f.id === farmerIdentifier);
    const farmerId = farmer?.id;

    if (farmerId) {
      try {
        await fetch(getApiUrl(`/api/officer/approve/${farmerId}`), {
          method: 'POST'
        });
      } catch (err) {
        console.warn('Backend approval failed, updating locally:', err);
      }
    }

    const farmers: RegisteredFarmer[] = JSON.parse(localStorage.getItem('registered_farmers') || '[]');
    const updatedFarmers = farmers.map(f => {
      if (f.phone === farmerIdentifier || f.id === farmerIdentifier) {
        return { ...f, status: 'approved' as const };
      }
      return f;
    });
    localStorage.setItem('registered_farmers', JSON.stringify(updatedFarmers));
    window.dispatchEvent(new Event('registered_farmers_updated'));
    setRegisteredFarmers(updatedFarmers);
    await loadRegisteredFarmers();

    confetti({
      particleCount: 90,
      spread: 60,
      origin: { y: 0.6 }
    });
    alert("किसान खाता सफलतापूर्वक सत्यापित हो गया है! (Farmer account approved successfully!)");
  };

  // Selected Token for Weighing & Inspection Modal
  const [inspectingToken, setInspectingToken] = useState<Token | null>(null);
  const [moistureInput, setMoistureInput] = useState<number>(11.4);
  const [gradeInput, setGradeInput] = useState<'Grade A' | 'Grade B' | 'Grade C'>('Grade A');
  const [netWeightQuintals, setNetWeightQuintals] = useState<number>(40.0);

  const activeMandi = mandis[0]; // Badshahpur Mandi

  const [dbBookings, setDbBookings] = useState<any[]>([]);

  const fetchBookings = async () => {
    try {
      const res = await fetch(getApiUrl('/api/bookings'));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.bookings)) {
          setDbBookings(data.bookings);
        }
      }
    } catch (err) {
      console.warn('[OfficerDashboard] Fetch bookings error:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (bookingId: string, nextStatus: string) => {
    try {
      const apiUrl = (import.meta as any).env?.VITE_BACKEND_URL || API_BASE_URL;
      const res = await fetch(`${apiUrl}/officer/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, newStatus: nextStatus })
      });

      if (res.ok) {
        playSuccessChime();
        await fetchBookings();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const renderRapidAction = (booking: any) => {
    const status = booking.status;

    switch (status) {
      case 'BOOKED':
      case 'SCHEDULED':
        return (
          <span className="text-slate-400 font-semibold text-xs inline-flex items-center gap-1 justify-end">
            <Clock className="w-3.5 h-3.5" />
            <span>Waiting for Arrival</span>
          </span>
        );

      case 'ARRIVED':
      case 'WAITING':
        return (
          <button
            type="button"
            onClick={() => handleStatusUpdate(booking.id, 'QUALITY_CHECK')}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-all flex items-center gap-1 ml-auto"
          >
            <span>Quality Pass</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );

      case 'QUALITY_CHECK':
        return (
          <button
            type="button"
            onClick={() => handleStatusUpdate(booking.id, 'WEIGHED')}
            className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-all flex items-center gap-1 ml-auto"
          >
            <span>Record Weight</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );

      case 'WEIGHED':
      case 'WEIGHING':
      case 'PAYMENT_PROCESSING':
        return (
          <button
            type="button"
            onClick={() => handleStatusUpdate(booking.id, 'PAID')}
            className="bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-all flex items-center gap-1 ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Send DBT</span>
          </button>
        );

      case 'PAID':
      case 'COMPLETED':
        return (
          <span className="text-emerald-700 font-black text-xs inline-flex items-center gap-1 justify-end">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Completed</span>
          </span>
        );

      default:
        return null;
    }
  };

  const displayTokens = useMemo(() => {
    const map = new Map<string, any>();

    // Initial store tokens
    allTokens.forEach((t) => {
      map.set(t.id, { ...t });
    });

    // Merge database bookings (overrides and additions)
    dbBookings.forEach((b) => {
      const existing = map.get(b.id);
      if (existing) {
        map.set(b.id, {
          ...existing,
          status: b.status,
          crop: b.crop || existing.crop,
          quantityQuintals: b.quantity || existing.quantityQuintals,
          farmerName: b.farmerName || existing.farmerName,
          farmerId: b.farmerId || existing.farmerId
        });
      } else {
        map.set(b.id, {
          id: b.id,
          tokenNumber: 99,
          farmerId: b.farmerId || 'HR-FARMER',
          farmerName: b.farmerName || 'Kisan',
          phone: '98765 00000',
          village: 'Mandi Area',
          crop: b.crop || 'Wheat',
          cropVariety: 'Standard',
          quantityQuintals: b.quantity || 40,
          mandiId: b.mandiId || 'mandi-badshahpur',
          mandiName: b.mandiName || 'Badshahpur APMC Mandi',
          scheduledDate: 'Today',
          scheduledTimeSlot: b.timeSlot || '11:00 AM - 12:00 PM',
          queuePosition: b.status === 'ARRIVED' || b.status === 'WAITING' ? 1 : 2,
          estimatedWaitMinutes: 5,
          status: b.status,
          createdAt: b.createdAt
        });
      }
    });

    return Array.from(map.values());
  }, [allTokens, dbBookings]);

  const filteredTokens = displayTokens.filter((token) => {
    const matchesSearch = 
      token.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.crop.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'WAITING') return token.status === 'SCHEDULED' || token.status === 'ARRIVED' || token.status === 'WAITING' || token.status === 'BOOKED';
    if (filterTab === 'PROCESSING') return token.status === 'QUALITY_CHECK' || token.status === 'WEIGHING' || token.status === 'WEIGHED' || token.status === 'PAYMENT_PROCESSING';
    if (filterTab === 'COMPLETED') return token.status === 'COMPLETED' || token.status === 'PAID';
    return true;
  });

  const handleCallNext = async () => {
    // 1. Advance local state
    advanceActiveTokenQueue();

    // 2. Call backend PUT /api/queue/next to advance database and emit Socket.io broadcast
    try {
      await fetch(getApiUrl('/api/queue/next'), {
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

        {/* Action Buttons: Scan QR & Call Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDashboardSection('SCANNER')}
            className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4 text-purple-200" />
            <span>गेट पास स्कैन (Scan QR)</span>
          </button>

          <button
            onClick={handleCallNext}
            className="bg-forest hover:bg-forest-light text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Megaphone className="w-4 h-4 text-forest-accent" />
            <span>{getTranslation(language, 'callNext')}</span>
          </button>
        </div>
      </div>

      {/* Section Switcher: KYC Verification vs Mandi Operations vs QR Gate Entry */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => setDashboardSection('KYC')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            dashboardSection === 'KYC'
              ? 'bg-forest text-white shadow-md'
              : 'text-slate-600 hover:bg-soil-50 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>KYC Verification (किसान सत्यापन)</span>
          {pendingFarmers.length > 0 && (
            <span className="bg-amber-400 text-amber-950 text-[11px] font-black px-2 py-0.5 rounded-full ml-1 animate-pulse">
              {pendingFarmers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setDashboardSection('SCANNER')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            dashboardSection === 'SCANNER'
              ? 'bg-purple-700 text-white shadow-md'
              : 'text-slate-600 hover:bg-soil-50 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Gate Entry (गेट QR स्कैन)</span>
        </button>

        <button
          onClick={() => setDashboardSection('OPERATIONS')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            dashboardSection === 'OPERATIONS'
              ? 'bg-forest text-white shadow-md'
              : 'text-slate-600 hover:bg-soil-50 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Yard Operations (मंडी संचालन)</span>
          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full ml-1">
            {allTokens.length}
          </span>
        </button>
      </div>

      {/* Section 1: Farmer KYC Verification Portal */}
      {dashboardSection === 'KYC' && (
        <div className="space-y-6 animate-fade-in">
          {/* KYC Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">कुल पंजीकृत किसान (Total Registered)</span>
                <span className="text-2xl font-black text-slate-900">{registeredFarmers.length}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-soil-100 text-slate-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-800 block font-bold">सत्यापन हेतु लंबित (Pending Review)</span>
                <span className="text-2xl font-black text-amber-900">{pendingFarmers.length}</span>
                <span className="text-[10px] text-amber-700 block">Action required to unlock login</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 block font-bold">सत्यापित व सक्रिय (Approved & Active)</span>
                <span className="text-2xl font-black text-emerald-900">{approvedFarmers.length}</span>
                <span className="text-[10px] text-emerald-700 block">Can log in to portal</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* KYC Filter Tabs */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 bg-soil-100 p-1 rounded-xl">
                <button
                  onClick={() => setKycTab('PENDING')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    kycTab === 'PENDING'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pending Review ({pendingFarmers.length})
                </button>
                <button
                  onClick={() => setKycTab('APPROVED')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    kycTab === 'APPROVED'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Approved ({approvedFarmers.length})
                </button>
              </div>

              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                {kycTab === 'PENDING' ? 'सत्यापन के लिए लंबित किसान खाते' : 'सत्यापित किसान खाते'}
              </span>
            </div>

            {/* List of Farmers */}
            {kycTab === 'PENDING' && (
              <div className="space-y-4">
                {pendingFarmers.length === 0 ? (
                  <div className="text-center py-12 bg-soil-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                    <h4 className="font-extrabold text-slate-900 text-base">कोई लंबित आवेदन नहीं (No Pending Applications)</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      All registered farmers have been reviewed and approved. New farmer signups will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingFarmers.map((farmer) => (
                      <div
                        key={farmer.phone}
                        className="bg-white border-2 border-amber-200 hover:border-amber-300 rounded-2xl p-5 shadow-sm space-y-4 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-900 text-base">{farmer.name}</h3>
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                                Pending KYC
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                              📞 +91 {farmer.phone} • Farmer ID: <span className="font-bold text-slate-800">#{farmer.id}</span>
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 bg-soil-100 px-2 py-1 rounded-lg">
                            Khasra / Aadhaar
                          </span>
                        </div>

                        {/* Document Preview Snippet Box */}
                        <div className="bg-soil-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-forest shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                Aadhaar & Land Record (भू-अभिलेख)
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Format: Verified Digital Document
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedDocFarmer(farmer)}
                            className="bg-white hover:bg-soil-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5 text-forest" />
                            <span>View Document (दस्तावेज़ देखें)</span>
                          </button>
                        </div>

                        {/* Massive Approve & Authenticate Button */}
                        <button
                          type="button"
                          onClick={() => handleApproveFarmer(farmer.phone)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm sm:text-base py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-5 h-5 text-emerald-200" />
                          <span>Approve & Authenticate (सत्यापित करें)</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Approved Tab */}
            {kycTab === 'APPROVED' && (
              <div className="space-y-4">
                {approvedFarmers.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No approved farmers found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {approvedFarmers.map((farmer) => (
                      <div
                        key={farmer.phone}
                        className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">{farmer.name}</h3>
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Approved
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              📞 +91 {farmer.phone} • ID: #{farmer.id}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDocFarmer(farmer)}
                            className="text-xs text-forest hover:underline flex items-center gap-1 font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Doc</span>
                          </button>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50/80 p-2 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Account authenticated. Farmer can log in with their phone & password.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 2: Gate Entry QR Scanner */}
      {dashboardSection === 'SCANNER' && (
        <div className="space-y-6 animate-fade-in py-2">
          <QRScanner
            onScanSuccess={async () => {
              confetti({
                particleCount: 90,
                spread: 70,
                origin: { y: 0.6 }
              });
              await fetchBookings();
              setFilterTab('WAITING');
              setDashboardSection('OPERATIONS');
            }}
            onClose={() => setDashboardSection('OPERATIONS')}
          />
        </div>
      )}

      {/* Section 3: Mandi Yard Operations */}
      {dashboardSection === 'OPERATIONS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Gate Entry Scanner Banner */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-sm shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-black text-slate-900 block">गेट प्रवेश QR स्कैनर (Gate Entry System)</strong>
                <span className="text-xs text-purple-900 font-medium">किसान के डिजिटल पास का QR कोड स्कैन करें — स्थिति तुरंत "WAITING" में अपडेट होगी</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDashboardSection('SCANNER')}
              className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shrink-0 flex items-center gap-2 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4 text-purple-200" />
              <span>कैमरा स्कैनर खोलें (Open Scanner)</span>
            </button>
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
                        token.status === 'COMPLETED' || token.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : token.status === 'PAYMENT_PROCESSING'
                          ? 'bg-blue-100 text-blue-800'
                          : token.status === 'ARRIVED' || token.status === 'WAITING'
                          ? 'bg-purple-100 text-purple-800'
                          : token.status === 'QUALITY_CHECK'
                          ? 'bg-blue-100 text-blue-800'
                          : token.status === 'WEIGHING' || token.status === 'WEIGHED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {token.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {renderRapidAction(token)}
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
    </div>
  )}

      {/* Document Preview Modal */}
      {selectedDocFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-forest text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-forest-accent" />
                <div>
                  <h3 className="font-bold text-base">
                    दस्तावेज़ सत्यापन • {selectedDocFarmer.name}
                  </h3>
                  <p className="text-xs text-forest-pale">
                    Phone: +91 {selectedDocFarmer.phone} • Farmer ID: #{selectedDocFarmer.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocFarmer(null)}
                className="text-forest-pale hover:text-white p-1 rounded-lg hover:bg-forest-light transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between bg-soil-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">सत्यापन स्थिति (Status):</span>
                  <span className={`font-black uppercase ${selectedDocFarmer.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedDocFarmer.status === 'approved' ? '✓ स्वीकृत (Approved)' : '⏳ लंबित समीक्षा (Pending Review)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">दस्तावेज़ प्रकार (Type):</span>
                  <span className="font-bold text-slate-900">Aadhaar / भू-अभिलेख (खसरा-खतौनी)</span>
                </div>
              </div>

              {/* Document Image Render */}
              <div className="border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 shadow-inner">
                <img
                  src={selectedDocFarmer.document}
                  alt={`Document for ${selectedDocFarmer.name}`}
                  className="w-full h-auto max-h-[380px] object-contain rounded-xl"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  मंडी अधिकारी सत्यापन दिशानिर्देश: कृपया सुनिश्चित करें कि खसरा संख्या, भूमि रकबा और किसान का नाम आधिकारिक राजस्व रिकॉर्ड के अनुरूप हैं।
                </span>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDocFarmer(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-soil-50"
                >
                  Close (बंद करें)
                </button>
                {selectedDocFarmer.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveFarmer(selectedDocFarmer.phone);
                      setSelectedDocFarmer(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve Immediately (तुरंत सत्यापित करें)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
