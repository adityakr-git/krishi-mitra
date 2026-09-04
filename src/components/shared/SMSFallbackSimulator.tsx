import React, { useState } from 'react';
import { MessageSquare, Send, X, Smartphone, ShieldCheck, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useProcurementStore } from '../../store/useProcurementStore';

interface SMSFallbackSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SMSFallbackSimulator: React.FC<SMSFallbackSimulatorProps> = ({ isOpen, onClose }) => {
  const { smsMessages, sendSMS, activeToken } = useProcurementStore();
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendSMS(activeToken.phone, inputText.trim(), 'INCOMING');
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-sm rounded-[40px] shadow-2xl border-4 border-slate-700 p-4 flex flex-col h-[620px] overflow-hidden text-white relative">
        
        {/* Phone Speaker & Camera Notch */}
        <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-forest text-forest-pale flex items-center justify-center text-xs font-bold">
              KM
            </div>
            <div>
              <h4 className="font-bold text-xs flex items-center gap-1 text-white">
                56161 <ShieldCheck className="w-3 h-3 text-emerald-400" />
              </h4>
              <p className="text-[10px] text-slate-400">Govt. Krishi Mitra Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Phone Inclusivity Note */}
        <div className="bg-slate-800/80 p-2 rounded-xl text-[10px] text-slate-300 my-2 border border-slate-700">
          📱 <strong>Zero-Smartphone Guarantee:</strong> Farmers without internet can send free SMS to <strong className="text-amber-300">56161</strong> to receive real-time queue tokens and wait times.
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto space-y-2.5 p-2 bg-slate-950/60 rounded-2xl border border-slate-800/60">
          {smsMessages.map((sms) => (
            <div
              key={sms.id}
              className={`flex flex-col ${sms.direction === 'INCOMING' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-2.5 rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                  sms.direction === 'INCOMING'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                }`}
              >
                <p>{sms.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                  {sms.direction === 'INCOMING' ? (
                    <ArrowUpRight className="w-3 h-3 text-blue-200" />
                  ) : (
                    <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                  )}
                  <span>{sms.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Command Suggestions */}
        <div className="py-2 flex gap-1.5 overflow-x-auto text-[10px]">
          {['STATUS', 'A-142', 'HELP'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                sendSMS(activeToken.phone, cmd, 'INCOMING');
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 font-mono transition-colors shrink-0"
            >
              SMS "{cmd}"
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Type STATUS or command..."
            className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
