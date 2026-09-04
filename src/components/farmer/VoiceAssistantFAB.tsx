import React from 'react';
import { Mic, Sparkles } from 'lucide-react';

interface VoiceAssistantFABProps {
  onOpenVoice: () => void;
}

export const VoiceAssistantFAB: React.FC<VoiceAssistantFABProps> = ({ onOpenVoice }) => {
  return (
    <div 
      className="fixed bottom-20 right-4 sm:bottom-22 sm:right-6 z-[9999] pointer-events-auto"
      style={{
        // Fallback for custom styling
        filter: 'drop-shadow(0 10px 15px rgba(27, 67, 50, 0.35))'
      }}
    >
      <button
        type="button"
        onClick={onOpenVoice}
        aria-label="Open Krishi Mitra Voice Assistant"
        title="कृषि मित्र आवाज़ साथी (Voice Assistant)"
        className="w-14 h-14 rounded-full bg-forest hover:bg-forest-light active:scale-95 text-white flex items-center justify-center border-2 border-white/90 shadow-2xl relative transition-all group hover:rotate-6"
      >
        {/* Animated Glow / Radar Pulse Effect */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />

        {/* Sparkle Badge */}
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 rounded-full bg-amber-400 border-2 border-white items-center justify-center text-[10px] font-black shadow-sm text-slate-950 animate-pulse">
          ✨
        </span>

        {/* Microphone Icon */}
        <Mic className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};
