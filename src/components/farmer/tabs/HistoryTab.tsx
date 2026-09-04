import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  FileText, 
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { Token, TokenStatus } from '../../../types';
import { useTranslation } from '../../../i18n/useTranslation';

interface HistoryTabProps {
  displayToken: Token;
}

interface PastSale {
  id: string;
  date: string;
  crop: string;
  quantityQuintals: number;
  ratePerQtl: number;
  totalAmount: number;
  mandiName: string;
  dbtRef: string;
  status: 'PAID';
}

const PAST_SALES: PastSale[] = [
  {
    id: 'sale_01',
    date: '15 Apr 2026',
    crop: 'Wheat (Sharbati) / गेहूं',
    quantityQuintals: 40,
    ratePerQtl: 2275,
    totalAmount: 91000,
    mandiName: 'Badshahpur APMC Mandi',
    dbtRef: 'DBT-2026-99381-HR',
    status: 'PAID'
  },
  {
    id: 'sale_02',
    date: '28 Mar 2026',
    crop: 'Mustard (Sarson) / सरसों',
    quantityQuintals: 32,
    ratePerQtl: 5650,
    totalAmount: 180800,
    mandiName: 'Sohna Regional Procurement Yard',
    dbtRef: 'DBT-2026-88120-HR',
    status: 'PAID'
  },
  {
    id: 'sale_03',
    date: '12 Mar 2026',
    crop: 'Gram (Chana) / चना',
    quantityQuintals: 28,
    ratePerQtl: 5440,
    totalAmount: 152320,
    mandiName: 'Pataudi Sub-Tehsil Mandi',
    dbtRef: 'DBT-2026-77341-HR',
    status: 'PAID'
  }
];

export const HistoryTab: React.FC<HistoryTabProps> = ({ displayToken }) => {
  const { t, language } = useTranslation();
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // 5-Stage Procurement Steps
  const simpleTrackerSteps = [
    { id: 1, labelKey: 'step1' as const, statusKey: 'SCHEDULED' },
    { id: 2, labelKey: 'step2' as const, statusKey: 'ARRIVED' },
    { id: 3, labelKey: 'step3' as const, statusKey: 'QUALITY_CHECK' },
    { id: 4, labelKey: 'step4' as const, statusKey: 'WEIGHING' },
    { id: 5, labelKey: 'step5' as const, statusKey: 'COMPLETED' },
  ];

  const getStepProgress = (currentStatus: TokenStatus) => {
    switch (currentStatus) {
      case 'SCHEDULED': return 1;
      case 'ARRIVED': return 2;
      case 'QUALITY_CHECK': return 3;
      case 'WEIGHING': return 4;
      case 'PAYMENT_PROCESSING': return 4;
      case 'COMPLETED': return 5;
      default: return 1;
    }
  };

  const currentStep = getStepProgress(displayToken.status);

  const handleDownloadReceipt = (sale: PastSale) => {
    setDownloadNotice(
      language === 'hi'
        ? `रसीद डाउनलोड हो गई: ${sale.crop} (₹${sale.totalAmount.toLocaleString()})`
        : `Downloaded receipt for ${sale.crop} (₹${sale.totalAmount.toLocaleString()})`
    );
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Header */}
      <div className="px-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {language === 'hi' ? 'खरीद एवं खाता इतिहास' : 'Payments & Procurement History'}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {language === 'hi' ? 'प्रत्यक्ष लाभ अंतरण (DBT) एवं पिछले भुगतानों का ब्यौरा' : 'Direct Benefit Transfer & Past Sales Ledger'}
        </p>
      </div>

      {/* Download Alert Toast */}
      {downloadNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-slide-up shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Active Token Bank Transfer Status Card */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t('bank_transfer_status')}
              </h2>
              <span className="text-[10px] text-slate-400">{t('direct_benefit_transfer')}</span>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            displayToken.paymentData?.paymentStatus === 'PAID'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-900'
          }`}>
            {displayToken.paymentData?.paymentStatus === 'PAID' ? t('transferred_to_bank') : t('pending_weighment')}
          </span>
        </div>

        <div className="bg-soil-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>{t('govt_msp_rate')}:</span>
            <strong className="text-slate-900">₹2,275 / {t('quintals')}</strong>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>{t('procurement_quantity')}:</span>
            <strong className="text-slate-900">{displayToken.quantityQuintals} {t('quintals')}</strong>
          </div>
          <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200">
            <span className="font-bold text-slate-900">{t('total_payable_amount')}:</span>
            <span className="text-lg font-black text-forest">
              ₹{(displayToken.paymentData?.netAmount || 91000).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
          <span>{t('linked_account')}: <strong>SBI •••• 4092</strong></span>
          <span className="text-forest font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> {t('msp_guarantee')}
          </span>
        </div>
      </div>

      {/* 5-Step Procurement Progress Tracker for Current Token */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t('procurement_progress')} (#{displayToken.id})
          </h2>
          <span className="text-[11px] font-bold text-forest bg-forest-pale px-2 py-0.5 rounded-full">
            {t('step_of', { current: currentStep, total: 5 })}
          </span>
        </div>

        <div className="space-y-3">
          {simpleTrackerSteps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  isCompleted 
                    ? 'bg-forest text-white' 
                    : isCurrent 
                    ? 'bg-amber-gold text-slate-950 ring-4 ring-amber-100 font-extrabold' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>

                <div className="flex-1 flex items-center justify-between">
                  <span className={`text-xs font-semibold ${
                    isCurrent ? 'text-slate-900 font-bold' : isCompleted ? 'text-forest' : 'text-slate-400'
                  }`}>
                    {t(step.labelKey)}
                  </span>

                  {isCurrent && (
                    <span className="text-[10px] font-bold text-amber-deep bg-amber-50 px-2 py-0.5 rounded-full">
                      {t('in_progress')}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {t('done')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Procurements Sales Ledger */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-forest" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === 'hi' ? 'पिछली बिक्री एवं रसीदें' : 'Past Sales & Receipts'}
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {PAST_SALES.length} {language === 'hi' ? 'रिकॉर्ड' : 'Records'}
          </span>
        </div>

        <div className="space-y-3">
          {PAST_SALES.map((sale) => (
            <div
              key={sale.id}
              className="p-3.5 bg-soil-50 rounded-2xl border border-slate-100 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">
                    {sale.crop}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    {sale.date} • {sale.quantityQuintals} Quintals @ ₹{sale.ratePerQtl}/Qtl
                  </span>
                </div>

                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  ✅ PAID
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] text-slate-400 block">{sale.mandiName}</span>
                  <span className="text-sm font-black text-forest">₹{sale.totalAmount.toLocaleString()}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(sale)}
                  className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                >
                  <Download className="w-3 h-3 text-forest" />
                  <span>{language === 'hi' ? 'रसीद डाउनलोड' : 'Receipt'}</span>
                </button>
              </div>

              <span className="text-[9px] text-slate-400 block">
                DBT Ref: <strong>{sale.dbtRef}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
