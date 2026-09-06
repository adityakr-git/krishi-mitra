import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Bot, User, Sparkles, Send, Volume2 } from 'lucide-react';
import { useProcurementStore } from '../../store/useProcurementStore';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../utils/api';

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

const greetings: Record<string, string> = {
  hi: 'नमस्ते किसान भाई! मैं कृषि मित्र हूँ। अपनी फसल, टोकन नंबर या मंडी भाव के बारे में कुछ भी पूछिए।',
  en: 'Hello farmer friend! I am Krishi Mitra. Ask me anything about crop prices, token status, or weather.',
  pa: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਮੈਂ ਕ੍ਰਿਸ਼ੀ ਮਿੱਤਰ ਹਾਂ। ਫ਼ਸਲ, ਮੰਡੀ ਭਾਅ ਜਾਂ ਟੋਕਨ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ।',
  mr: 'नमस्कार शेतकरी बंधूंनो! मी कृषी मित्र आहे. पिकांचे भाव, टोकन किंवा हवामानाबद्दल काहीही विचारा.',
  bn: 'নমস্কার কৃষক বন্ধু! আমি কৃষি মিত্র। ফসল, টোকেন বা মান্ডি দর সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।'
};

const sampleFarmerQuestionsMap: Record<string, string[]> = {
  hi: ['मेरा नंबर कब आएगा?', 'आज गेहूं का मंडी भाव क्या है?', 'मेरे पैसे कब खाते में आएंगे?', 'आज का मौसम कैसा रहेगा?'],
  en: ['When is my turn?', "What is today's wheat MSP?", 'When will DBT money arrive?', "How is today's weather?"],
  pa: ['ਮੇਰਾ ਨੰਬਰ ਕਦੋਂ ਆਵੇਗਾ?', 'ਅੱਜ ਕਣਕ ਦਾ ਮੰਡੀ ਭਾਅ ਕੀ ਹੈ?', 'ਖਾਤੇ ਵਿੱਚ ਪੈਸੇ ਕਦੋਂ ਆਉਣਗੇ?', 'ਅੱਜ ਦਾ ਮੌਸਮ ਕਿਹੋ ਜਿਹਾ ਰਹੇਗਾ?'],
  mr: ['माझा नंबर कधी येईल?', 'आज गव्हाचा हमीभाव काय आहे?', 'खात्यात पैसे कधी जमा होतील?', 'आजचे हवामान कसे राहील?'],
  bn: ['আমার পালা কখন আসবে?', 'আজ গমের মান্ডি দর কত?', 'অ্যাকাউন্টে টাকা কখন ঢুকবে?', 'আজকের আবহাওয়া কেমন থাকবে?']
};

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ 
  isOpen: externalIsOpen, 
  onClose: externalOnClose,
  autoStart = false
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onClose = externalOnClose || (() => setInternalIsOpen(false));

  const { currentLang, t } = useLanguage();

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      sender: 'bot',
      text: greetings[currentLang] || greetings.hi,
      time: 'Just now'
    }
  ]);

  const { activeToken } = useProcurementStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Pre-load available voices on component mount for Web Speech API stability
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Update initial bot greeting if user toggles language and no chat has happened yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [
          {
            sender: 'bot',
            text: greetings[currentLang] || greetings.hi,
            time: 'Just now'
          }
        ];
      }
      return prev;
    });
  }, [currentLang]);

  // Auto scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  /**
   * 2. Fix Text-to-Speech (AI Speaking Back)
   */
  const speakText = (text: string, langCode: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Sanitize text for clear rural audio pronunciation
      const cleanText = text
        .replace(/[*_~`#]/g, '')
        .replace(/-/g, ' ')
        .replace(/₹/g, langCode === 'en' ? 'Rupees ' : 'रुपये ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode === 'en' ? 'en-IN' : 'hi-IN'; // Fallback to Hindi if not English
      utterance.rate = 0.9; // Slower for farmer accessibility

      // Try to find a local voice matching the language
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find((v) => 
        v.lang.includes(utterance.lang) || 
        v.lang.replace('_', '-').includes(utterance.lang) ||
        (utterance.lang.startsWith('hi') && (v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'))) ||
        (utterance.lang.startsWith('en') && (v.lang.includes('en-IN') || v.name.toLowerCase().includes('india')))
      );
      if (targetVoice) utterance.voice = targetVoice;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech synthesis error:", err);
    }
  };

  /**
   * 1. Fix Speech-to-Text (Microphone Input)
   */
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please use Chrome.");
      return;
    }

    // Stop any existing recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    // Stop any ongoing speech synthesis so mic doesn't pick up the speaker
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = currentLang === 'en' ? 'en-IN' : 'hi-IN'; // Fallback to Hindi if not English
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          if (transcript && transcript.trim()) {
            setInputText(transcript);
            handleSendMessage(transcript); // Send to AI
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Cleanup speech recognition and timers on modal close/unmount
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen]);

  const hasAutoStartedRef = useRef(false);

  // Auto-start listening once when modal opened via Voice Help button
  useEffect(() => {
    if (isOpen && autoStart && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      const timer = setTimeout(() => {
        startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      hasAutoStartedRef.current = false;
    }
  }, [isOpen, autoStart]);

  /**
   * Multi-Lingual Gemini AI Powered Farmer Assistant Engine
   */
  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { sender: 'user', text: query, time: timeNow };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const apiUrl = (import.meta as any).env?.VITE_BACKEND_URL || API_BASE_URL;
      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, language: currentLang })
      });

      const data = await response.json();
      let reply = '';

      if (data.success && data.reply) {
        reply = data.reply;
      } else {
        reply = data.error || (currentLang === 'en' ? 'Sorry farmer friend, could not load data.' : 'माफ़ करें किसान भाई, अभी जानकारी लोड नहीं हो सकी।');
      }

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
      speakText(reply, currentLang);
    } catch (error) {
      console.warn('[VoiceAssistant] API call failed, using intelligent offline response:', error);
      const lower = query.toLowerCase();
      let fallbackReply = '';

      if (currentLang === 'en') {
        fallbackReply = 'Hello farmer friend! Krishi Mitra is at your service.';
        if (lower.includes('number') || lower.includes('turn') || lower.includes('wait') || lower.includes('queue')) {
          fallbackReply = `Farmer friend, your token ${activeToken?.id || 'A-142'} is at position ${activeToken?.queuePosition || 1}. Estimated wait is ${activeToken?.estimatedWaitMinutes || 10} minutes.`;
        } else if (lower.includes('rate') || lower.includes('msp') || lower.includes('wheat') || lower.includes('price')) {
          fallbackReply = "Today's government MSP for Wheat is ₹2,275 per quintal.";
        } else if (lower.includes('money') || lower.includes('dbt') || lower.includes('payment') || lower.includes('bank')) {
          fallbackReply = 'Your payment will be credited directly to your bank account via DBT once weighing is complete.';
        } else if (lower.includes('weather') || lower.includes('rain')) {
          fallbackReply = 'Today the weather is clear with no rain expected. You can visit the mandi smoothly.';
        }
      } else if (currentLang === 'pa') {
        fallbackReply = 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਕ੍ਰਿਸ਼ੀ ਮਿੱਤਰ ਹਾਜ਼ਰ ਹੈ।';
        if (lower.includes('ਨੰਬਰ') || lower.includes('ਵਾਰੀ') || lower.includes('ਕਤਾਰ') || lower.includes('wait')) {
          fallbackReply = `ਕਿਸਾਨ ਵੀਰ ਜੀ, ਤੁਹਾਡਾ ਟੋਕਨ ${activeToken?.id || 'A-142'} ਕਤਾਰ ਵਿੱਚ ${activeToken?.queuePosition || 1} ਨੰਬਰ 'ਤੇ ਹੈ। ਲਗਭਗ ${activeToken?.estimatedWaitMinutes || 10} ਮਿੰਟ ਵਿੱਚ ਵਾਰੀ ਆ ਜਾਵੇਗੀ।`;
        } else if (lower.includes('ਭਾਅ') || lower.includes('ਰੇਟ') || lower.includes('ਕਣਕ') || lower.includes('msp')) {
          fallbackReply = 'ਅੱਜ ਕਣਕ ਦਾ ਸਰਕਾਰੀ ਸਮਰਥਨ ਮੁੱਲ (MSP) ₹2,275 ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ।';
        } else if (lower.includes('ਪੈਸੇ') || lower.includes('ਖਾਤਾ') || lower.includes('ਡੀ.ਬੀ.ਟੀ')) {
          fallbackReply = 'ਤੋਲ ਪੂਰਾ ਹੁੰਦੇ ਹੀ ਤੁਹਾਡੀ ਰਕਮ ਸਿੱਧੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ DBT ਰਾਹੀਂ ਜਮ੍ਹਾਂ ਹੋ ਜਾਵੇਗੀ।';
        } else if (lower.includes('ਮੌਸਮ') || lower.includes('ਮੀਂਹ')) {
          fallbackReply = 'ਅੱਜ ਮੌਸਮ ਸਾਫ਼ ਹੈ, ਤੁਸੀਂ ਆਰਾਮ ਨਾਲ ਮੰਡੀ ਆ ਸਕਦੇ ਹੋ।';
        }
      } else if (currentLang === 'mr') {
        fallbackReply = 'नमस्कार शेतकरी बंधूंनो! कृषी मित्र आपल्या सेवेत हजर आहे.';
        if (lower.includes('नंबर') || lower.includes('पाळी') || lower.includes('रांग')) {
          fallbackReply = `शेतकरी बंधू, तुमचा टोकन ${activeToken?.id || 'A-142'} रांगेत ${activeToken?.queuePosition || 1} क्रमांकावर आहे. अंदाजे ${activeToken?.estimatedWaitMinutes || 10} मिनिटांत तुमची पाळी येईल.`;
        } else if (lower.includes('भाव') || lower.includes('हमीभाव') || lower.includes('गहू') || lower.includes('दर')) {
          fallbackReply = 'आज गव्हाचा सरकारी हमीभाव (MSP) ₹2,275 प्रति क्विंटल आहे.';
        } else if (lower.includes('पैसे') || lower.includes('खाते') || lower.includes('dbt')) {
          fallbackReply = 'वजन पूर्ण होताच तुमची रक्कम थेट बँक खात्यात DBT द्वारे जमा केली जाईल.';
        } else if (lower.includes('हवामान') || lower.includes('पाऊस')) {
          fallbackReply = 'आज हवामान निरभ्र आहे, पावसाची शक्यता नाही.';
        }
      } else {
        // Hindi Default
        fallbackReply = 'नमस्ते किसान भाई! आपकी सेवा में कृषि मित्र हाजिर है।';
        if (lower.includes('नंबर') || lower.includes('number') || lower.includes('बारी') || lower.includes('wait') || lower.includes('कब आएगा') || lower.includes('कतार')) {
          fallbackReply = `किसान भाई, आपका टोकन ${activeToken?.id || 'A-142'} कतार में ${activeToken?.queuePosition || 1} नंबर पर है। लगभग ${activeToken?.estimatedWaitMinutes || 10} मिनट में आपकी बारी आ जाएगी।`;
        } else if (lower.includes('भाव') || lower.includes('रेट') || lower.includes('msp') || lower.includes('गेहूं') || lower.includes('price')) {
          fallbackReply = 'किसान भाई, आज गेहूं का सरकारी समर्थन मूल्य (MSP) ₹2,275 प्रति क्विंटल है और बादशाहपुर मंडी में अच्छा भाव मिल रहा है।';
        } else if (lower.includes('पैसे') || lower.includes('खाता') || lower.includes('dbt') || lower.includes('payment')) {
          fallbackReply = 'किसान भाई, तौल पूरा होते ही आपकी राशि सीधे आपके बैंक खाते में DBT द्वारा जमा करा दी जाएगी।';
        } else if (lower.includes('मौसम') || lower.includes('weather') || lower.includes('बारिश')) {
          fallbackReply = 'किसान भाई, आज मौसम साफ है और बारिश की कोई संभावना नहीं है। आप आराम से मंडी आ सकते हैं।';
        } else {
          fallbackReply = 'नमस्ते किसान भाई! बताइए आज मैं आपकी क्या सहायता करूं?';
        }
      }

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: fallbackReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
      speakText(fallbackReply, currentLang);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleFarmerQuestions = sampleFarmerQuestionsMap[currentLang] || sampleFarmerQuestionsMap.hi;

  const subtitles: Record<string, string> = {
    hi: 'सरल हिंदी में किसान सहायता (Audio Enabled)',
    en: 'Farmer Voice & AI Assistant (Audio Enabled)',
    pa: 'ਸਰਲ ਪੰਜਾਬੀ ਵਿੱਚ ਕਿਸਾਨ ਸਹਾਇਤਾ (Audio Enabled)',
    mr: 'सोप्या मराठीत शेतकरी मदत (Audio Enabled)',
    bn: 'সহজ বাংলায় কৃষক সহায়তা (Audio Enabled)'
  };

  const placeholders: Record<string, { listening: string; idle: string }> = {
    hi: { listening: 'माइक चालू है... बोलिए किसान भाई', idle: 'यहाँ बोलें या हिंदी में लिखें...' },
    en: { listening: 'Listening... Please speak now', idle: 'Speak or type your question...' },
    pa: { listening: 'ਮਾਈਕ ਚਾਲੂ ਹੈ... ਬੋਲੋ ਕਿਸਾਨ ਵੀਰ ਜੀ', idle: 'ਇੱਥੇ ਬੋਲੋ ਜਾਂ ਲਿਖੋ...' },
    mr: { listening: 'माइक चालू आहे... बोला शेतकरी बंधू', idle: 'येथे बोला किंवा लिहा...' },
    bn: { listening: 'মাইক চালু আছে... বলুন কৃষক বন্ধু', idle: 'এখানে বলুন বা লিখুন...' }
  };

  const activePlaceholder = placeholders[currentLang] || placeholders.hi;

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
                    {t('voice_help') || 'कृषि मित्र आवाज़ साथी'} <Sparkles className="w-4 h-4 text-amber-300" />
                  </h3>
                  <p className="text-xs text-forest-pale">{subtitles[currentLang] || subtitles.hi}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopListening();
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
                          onClick={() => speakText(m.text, currentLang)}
                          title="दोबारा सुनें (Listen again)"
                          className="text-forest hover:text-forest-light flex items-center gap-1 text-[10px] font-bold"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
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
              {isLoading && (
                <div className="flex items-start gap-2.5 justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-forest-accent animate-pulse" />
                  </div>
                  <div className="p-3 bg-white text-slate-600 border border-slate-200 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span className="font-semibold text-forest">
                      {currentLang === 'en' ? 'Krishi Mitra is thinking...' : 'कृषि मित्र सोच रहा है...'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Visual Feedback for Listening State */}
            {isListening && (
              <div className="px-3.5 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between text-xs text-red-700 animate-pulse font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <span>
                    {currentLang === 'en'
                      ? '🎙️ Listening... Speak your question now'
                      : '🎙️ आवाज़ सुन रहा हूँ... कृपया बोलिए'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  className="text-[10px] bg-red-200 hover:bg-red-300 text-red-900 px-2 py-0.5 rounded font-bold transition-colors"
                >
                  {currentLang === 'en' ? 'Stop' : 'रोकें'}
                </button>
              </div>
            )}

            {/* Suggested Prompts (Pills) */}
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
              
              {/* Glowing / Pulsing Mic Button with Visual Feedback */}
              <div className="relative">
                {isListening && (
                  <span className="absolute -inset-1.5 rounded-full bg-red-500 animate-ping opacity-75 pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`relative p-3.5 rounded-full transition-all flex items-center justify-center shadow-lg active:scale-95 ${
                    isListening
                      ? 'bg-red-600 text-white ring-4 ring-red-300 animate-pulse shadow-red-500/50'
                      : 'bg-forest text-white hover:bg-forest-light'
                  }`}
                  title={isListening ? 'माइक चालू है... रोकने के लिए दबाएं' : 'बोलने के लिए माइक दबाएं'}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 text-white animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5 text-white" />
                  )}
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
                placeholder={isListening ? activePlaceholder.listening : activePlaceholder.idle}
                className={`flex-1 bg-soil-100 border text-slate-900 font-semibold text-xs rounded-2xl px-3.5 py-3 focus:outline-none transition-all ${
                  isListening 
                    ? 'border-red-400 ring-2 ring-red-300 placeholder-red-600 font-bold' 
                    : 'border-slate-200 focus:ring-2 focus:ring-forest'
                }`}
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
