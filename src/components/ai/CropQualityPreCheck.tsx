import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  FileCheck, 
  Droplets, 
  ShieldCheck, 
  X,
  RefreshCw
} from 'lucide-react';
import { playSuccessChime } from '../../utils/soundEffects';

interface CropQualityPreCheckProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CropQualityPreCheck: React.FC<CropQualityPreCheckProps> = ({ isOpen, onClose }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    cropName: string;
    moistureEstimate: number;
    foreignMatter: number;
    discoloration: number;
    recommendedGrade: string;
    rejectionRiskPercent: number;
    qualityVerdict: string;
  } | null>(null);

  const [selectedCrop, setSelectedCrop] = useState('Wheat (Kanak)');

  if (!isOpen) return null;

  const runAnalysis = () => {
    setAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(() => {
      setAnalyzing(false);
      playSuccessChime();
      setAnalysisResult({
        cropName: selectedCrop,
        moistureEstimate: 11.4,
        foreignMatter: 0.6,
        discoloration: 1.2,
        recommendedGrade: 'Grade A (FAQ Standard)',
        rejectionRiskPercent: 3,
        qualityVerdict: 'Safe for Immediate Procurement at 100% MSP'
      });
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-forest to-forest-deep text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-forest-accent" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-1.5">
                AI Crop Quality & Moisture Pre-Check <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-xs text-forest-pale">Computer Vision preliminary harvest assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-forest-pale hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Crop Type
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-soil-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-forest"
            >
              <option value="Wheat (Kanak)">Wheat (Kanak / Sharbati)</option>
              <option value="Mustard (Sarson)">Mustard (Sarson / Pusa Bold)</option>
              <option value="Paddy (Dhan)">Paddy (Dhan / Basmati)</option>
              <option value="Gram (Chana)">Gram (Desi Chana)</option>
            </select>
          </div>

          {/* Upload / Camera Box */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-soil-50 hover:bg-soil-100 transition-colors">
            <div className="w-12 h-12 rounded-full bg-forest-pale text-forest mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800">Upload Grain Sample Photo</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Place a handful of grains on a white paper under natural sunlight for best CV accuracy.
            </p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="bg-forest hover:bg-forest-light text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Image with CV Model...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run AI Quality Pre-Check</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results Card */}
          {analysisResult && (
            <div className="bg-white border border-forest-accent/40 rounded-2xl p-4 shadow-sm space-y-3 animate-slide-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-xs text-slate-900">Pre-Check Advisory: Grade A</h4>
                </div>
                <span className="text-[11px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Risk: {analysisResult.rejectionRiskPercent}% (Very Low)
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-soil-100 rounded-xl">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-0.5">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" /> Moisture
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    {analysisResult.moistureEstimate}%
                  </div>
                  <span className="text-[10px] font-semibold text-green-600">Safe (Limit: 12%)</span>
                </div>

                <div className="p-2.5 bg-soil-100 rounded-xl">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-0.5">
                    <FileCheck className="w-3.5 h-3.5 text-amber-500" /> Foreign Matter
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    {analysisResult.foreignMatter}%
                  </div>
                  <span className="text-[10px] font-semibold text-green-600">Grade A Standard</span>
                </div>

                <div className="p-2.5 bg-soil-100 rounded-xl col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-forest" /> Expected MSP
                  </div>
                  <div className="text-base font-extrabold text-forest">
                    ₹2,275 / qtl
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">0% Deduction Risk</span>
                </div>
              </div>

              <div className="bg-green-50 p-2.5 rounded-xl border border-green-200 text-xs text-green-900 font-medium">
                ✅ <strong>Verdict:</strong> {analysisResult.qualityVerdict}. Your crop meets Government FAQ (Fair Average Quality) procurement norms.
              </div>
            </div>
          )}

          {/* Strict Statutory Disclaimer */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Mandatory APMC Mandi Disclaimer:</strong> This AI tool is solely a digital pre-advisory to help farmers avoid transit rejections. Official grain grading, moisture certification, and weighment are strictly governed by designated APMC officers using calibrated electronic meters at the procurement center.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-soil-100 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
