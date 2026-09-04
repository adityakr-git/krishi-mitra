import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Bot, User, Sparkles, Send, Volume2 } from 'lucide-react';
import { useProcurementStore } from '../../store/useProcurementStore';
import { useKrishiVoice } from '../../hooks/useKrishiVoice';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

interface VoiceAssistantModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoStart?: boolean;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ 
  isOpen: externalIsOpen, 
  onClose: externalOnClose,
  autoStart = false
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onClose = externalOnClose || (() => setInternalIsOpen(false));

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'नमस्ते किसान भाई! मैं कृषि मित्र हूँ। अपनी फसल, टोकन नंबर या मंडी भाव के बारे में कुछ भी पूछिए।',
      time: 'Just now'
    }
  ]);

  const { activeToken } = useProcurementStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Robust Krishi Voice Hook
  const { isListening, startListening, speak } = useKrishiVoice((transcript) => {
    // This runs when the farmer finishes speaking
    setInputText(transcript);
    handleSendMessage(transcript);
  });

  // Auto-start listening if modal opened via Voice Help button
  useEffect(() => {
    if (isOpen && autoStart) {
      const timer = setTimeout(() => {
        startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoStart, startListening]);

  /**
   * AI Farmer Persona Engine (< 2 sentences, respectful Hindi, zero technical jargon)
   */
  const handleSendMessage = (query: string) => {
    if (!query.trim()) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { sender: 'user', text: query, time: timeNow };
    setMessages((prev) => [...prev, userMsg]);

    const lower = query.toLowerCase();
    let reply = '';

    if (lower.includes('नंबर') || lower.includes('number') || lower.includes('कब आएगा') || lower.includes('time') || lower.includes('कतार') || lower.includes('wait') || lower.includes('बारी')) {
      reply = `नमस्ते किसान भाई! आपका टोकन A 142 कतार में ${activeToken.queuePosition} नंबर पर है और लगभग ${activeToken.estimatedWaitMinutes} मिनट में आपकी बारी आ जाएगी।`;
    } else if (lower.includes('भाव') || lower.includes('रेट') || lower.includes('rate') || lower.includes('price') || lower.includes('msp') || lower.includes('गेहूं')) {
      reply = `किसान भाई, आज गेहूं का सरकारी एमएसपी ₹2,275 है और बादशाहपुर मंडी में ₹2,300 का अच्छा भाव मिल रहा है।`;
    } else if (lower.includes('पैसे') || lower.includes('रुपये') || lower.includes('payment') || lower.includes('खाता') || lower.includes('dbt')) {
      reply = `किसान भाई, तौल पूरा होते ही आपकी ₹91,000 की राशि सीधे आपके बैंक खाते में भेज दी जाएगी। कोई भी कटौती नहीं होगी।`;
    } else if (lower.includes('मौसम') || lower.includes('weather') || lower.includes('बारिश') || lower.includes('धूप')) {
      reply = `किसान भाई, आज मौसम बिल्कुल साफ रहेगा और बारिश की कोई संभावना नहीं है। आप आराम से अपनी फसल मंडी ला सकते हैं।`;
    } else if (lower.includes('सरसों') || lower.includes('mustard')) {
      reply = `किसान भाई, सरसों का सरकारी भाव ₹5,650 है और सोहना मंडी में ₹5,720 तक का बढ़िया रेट चल रहा है।`;
    } else {
      reply = `नमस्ते किसान भाई! आपकी सेवा में कृषि मित्र हाजिर है, बताइए आज आपकी क्या सहायता करूं?`;
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: 'bot', text: reply, time: timeNow }]);
      // Automatically speaks the entire generated Hindi sentence out loud!
      speak(reply);
    }, 250);
  };

  const sampleFarmerQuestions = [
    'मेरा नंबर कब आएगा?',
    'आज गेहूं का मंडी भाव क्या है?',
    'मेरे पैसे कब खाते में आएंगे?',
    'आज का मौसम कैसा रहेगा?'
  ];

  return (
    <>
      {/* Persistent Floating Microphone Button (Only visible if not controlled externally) */}
      {externalIsOpen === undefined && (
        <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
          <button
            onClick={() => setInternalIsOpen(true)}
            title="कृषि मित्र आवाज़ सहायता (Voice Help)"
            className="relative bg-gradient-to-r from-forest to-forest-light text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
          >
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 text-[8px] font-black items-center justify-center text-slate-950">
                🎙️
              </span>
            </span>
            <Mic className="w-6 h-6 text-forest-pale" />
          </button>
        </div>
      )}

      {/* Voice Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200 flex flex-col h-[560px] overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-forest text-white p-4 flex items-center justify-between border-b border-forest-light">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-forest-accent" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
                    कृषि मित्र आवाज़ साथी <Sparkles className="w-4 h-4 text-amber-300" />
                  </h3>
                  <p className="text-xs text-forest-pale">सरल हिंदी में किसान सहायता (Audio Enabled)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  onClose();
                }}
                className="p-1.5 rounded-full text-forest-pale hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-soil-50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-forest-accent" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs relative group ${
                      m.sender === 'user'
                        ? 'bg-forest text-white rounded-tr-none font-medium'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-semibold'
                    }`}
                  >
                    <p>{m.text}</p>
                    <div className="flex items-center justify-between mt-1 pt-0.5 border-t border-slate-100/40">
                      {m.sender === 'bot' && (
                        <button
                          type="button"
                          onClick={() => speak(m.text)}
                          title="दोबारा सुनें (Listen again)"
                          className="text-forest hover:text-forest-light flex items-center gap-1 text-[10px] font-bold"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>सुनें</span>
                        </button>
                      )}
                      <span className={`block text-[9px] ${m.sender === 'user' ? 'text-forest-pale/80 ml-auto' : 'text-slate-400 ml-auto'}`}>
                        {m.time}
                      </span>
                    </div>
                  </div>
                  {m.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 3. Wire Up the "Suggested Prompts" (Pills) */}
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto">
              {sampleFarmerQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    handleSendMessage(q);
                  }}
                  className="whitespace-nowrap text-xs font-semibold bg-soil-100 hover:bg-forest-pale hover:text-forest text-slate-700 px-3 py-1.5 rounded-full transition-colors border border-slate-200 shrink-0 active:scale-95"
                >
                  "{q}"
                </button>
              ))}
            </div>

            {/* Voice Input & Glowing Mic Controller */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              
              {/* Glowing / Pulsing Mic Button */}
              <div className="relative">
                {isListening && (
                  <span className="absolute -inset-1 rounded-full bg-red-400 animate-ping opacity-75"></span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!isListening) {
                      startListening();
                    }
                  }}
                  className={`relative p-3.5 rounded-full transition-all flex items-center justify-center shadow-md ${
                    isListening
                      ? 'bg-red-600 text-white ring-4 ring-red-200 animate-pulse'
                      : 'bg-forest text-white hover:bg-forest-light'
                  }`}
                  title={isListening ? 'माइक चालू है... सुन रहा हूँ' : 'बोलने के लिए माइक दबाएं'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputText.trim()) {
                    handleSendMessage(inputText);
                    setInputText('');
                  }
                }}
                placeholder={isListening ? "माइक चालू है... बोलिए किसान भाई" : "यहाँ बोलें या हिंदी में लिखें..."}
                className="flex-1 bg-soil-100 border border-slate-200 text-slate-900 font-semibold text-xs rounded-2xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-forest"
              />

              <button
                type="button"
                onClick={() => {
                  if (inputText.trim()) {
                    handleSendMessage(inputText);
                    setInputText('');
                  }
                }}
                disabled={!inputText.trim()}
                className="p-3 bg-forest text-white rounded-2xl hover:bg-forest-light disabled:opacity-40 transition-all shadow-sm active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
