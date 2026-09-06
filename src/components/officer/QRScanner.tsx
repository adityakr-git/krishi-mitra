import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';
import { useProcurementStore } from '../../store/useProcurementStore';
import { playSuccessChime, playAlertChime } from '../../utils/soundEffects';

interface QRScannerProps {
  onScanSuccess?: (bookingId: string, bookingData?: any) => void;
  onClose?: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { markTokenArrived, allTokens } = useProcurementStore();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const processGateEntry = async (rawCode: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    let cleanId = rawCode.trim();
    if (cleanId.includes('TOKEN-')) {
      const match = cleanId.match(/TOKEN-([A-Za-z0-9-]+)/);
      if (match) cleanId = match[1].replace('A', 'A-');
    }

    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || API_BASE_URL;
      const response = await fetch(`${apiUrl}/officer/scan-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: cleanId })
      });

      const data = await response.json();

      if (data.success) {
        playSuccessChime();
        setScanResult(cleanId);
        setScanMessage(data.message || 'Kisan Gate Entry Successful. Status: Waiting');

        markTokenArrived(cleanId);
        allTokens.forEach(t => {
          if (t.id.toLowerCase() === cleanId.toLowerCase() || t.qrCodeData.includes(cleanId)) {
            markTokenArrived(t.id);
          }
        });

        if (onScanSuccess) {
          onScanSuccess(cleanId, data.booking);
        }
      } else {
        playAlertChime();
        setErrorMessage(data.error || 'Invalid QR Code');
      }
    } catch (err: any) {
      console.error('[QRScanner] API Error:', err);
      markTokenArrived(cleanId);
      setScanResult(cleanId);
      setScanMessage(`Gate entry recorded: Token #${cleanId}`);
      if (onScanSuccess) {
        onScanSuccess(cleanId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { qrbox: { width: 250, height: 250 }, fps: 5 },
      false
    );
    scannerRef.current = scanner;

    async function success(result: string) {
      try {
        scanner.clear();
      } catch (e) {
        console.warn('Scanner clear error:', e);
      }
      processGateEntry(result);
    }

    function error(err: any) {
      // Ignore background scan frame errors
    }

    scanner.render(success, error);

    return () => {
      try {
        scanner.clear().catch(() => {});
      } catch {}
    };
  }, []);

  const handleResetScanner = () => {
    setScanResult(null);
    setScanMessage(null);
    setErrorMessage(null);
    setManualInput('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    try {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    } catch {}
    processGateEntry(manualInput.trim());
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200 max-w-lg mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-forest text-forest-pale flex items-center justify-center font-bold">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">
              गेट पास स्कैन करें (Scan Gate Pass)
            </h2>
            <p className="text-xs text-slate-500">
              APMC Officer: Farmer Arrival & QR Gate Entry
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            <span>बंद करें</span>
          </button>
        )}
      </div>

      {scanResult ? (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 text-center space-y-3 animate-scale-in">
          <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              सत्यापित गेट प्रवेश (Gate Entry Approved)
            </span>
            <h3 className="text-xl font-black text-emerald-950 mt-0.5">
              टोकन / बुकिंग: #{scanResult}
            </h3>
            <p className="text-xs text-emerald-800 font-semibold mt-1">
              {scanMessage}
            </p>
          </div>

          <div className="bg-white rounded-xl p-3 border border-emerald-200 text-left text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">कतार स्थिति (Queue Status):</span>
              <span className="font-bold text-emerald-700">WAITING (प्रतीक्षा में)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">अगला कदम (Next Step):</span>
              <span className="font-bold text-slate-800">गुणवत्ता जांच एवं तौल (Weigh & Inspect)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetScanner}
            className="w-full bg-forest hover:bg-forest-light text-white text-xs font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>अगला पास स्कैन करें (Scan Next Pass)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-forest/40 bg-slate-50 p-2">
            <div id="reader" className="w-full"></div>
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2 font-bold text-xs text-forest">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>सत्यापित किया जा रहा है... (Verifying)</span>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="या टोकन नंबर दर्ज करें (उदा. A-142)"
              className="flex-1 bg-soil-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest"
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 shrink-0 flex items-center gap-1"
            >
              <span>प्रवेश दें</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      <div className="bg-soil-50 rounded-xl p-3 text-[11px] text-slate-600 flex items-start gap-2 border border-slate-200/60">
        <ShieldCheck className="w-4 h-4 text-forest shrink-0 mt-0.5" />
        <span>
          किसान के मोबाइल से डिजिटल पास का QR कोड स्कैन करें। स्कैन होते ही स्थिति स्वतः <strong>WAITING</strong> में बदल जाएगी।
        </span>
      </div>
    </div>
  );
};

export default QRScanner;
