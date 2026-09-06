import { useState, useEffect, useCallback, useRef } from 'react';

export const speechLocales: Record<string, string> = {
  hi: 'hi-IN',
  en: 'en-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  bn: 'bn-IN'
};

export const useKrishiVoice = (
  onTextCaptured?: (text: string) => void,
  langCode: string = 'hi'
) => {
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null); // Prevents infinite loops across re-renders
  const onTextCapturedRef = useRef(onTextCaptured);
  const langCodeRef = useRef(langCode);

  useEffect(() => {
    onTextCapturedRef.current = onTextCaptured;
  }, [onTextCaptured]);

  useEffect(() => {
    langCodeRef.current = langCode;
  }, [langCode]);

  // Load TTS Voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Text-to-Speech
  const speak = useCallback((text: string, langOverride?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const targetLang = langOverride || langCodeRef.current || 'hi';
    const targetLocale = speechLocales[targetLang] || 'hi-IN';

    let currencyWord = 'रुपये ';
    if (targetLang === 'en') currencyWord = 'Rupees ';
    else if (targetLang === 'pa') currencyWord = 'ਰੁਪਏ ';
    else if (targetLang === 'bn') currencyWord = 'টাকা ';

    const sanitizedText = text
      .replace(/#/g, '')
      .replace(/-/g, ' ')
      .replace(/₹/g, currencyWord)
      .replace(/[*_~`]/g, '');
    const utterance = new SpeechSynthesisUtterance(sanitizedText);
    utterance.lang = targetLocale;
    utterance.rate = 0.9;
    
    const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const langPrefix = targetLocale.split('-')[0].toLowerCase();
    const matchedVoice = availableVoices.find(v => 
      v.lang.toLowerCase() === targetLocale.toLowerCase() ||
      v.lang.toLowerCase().replace('_', '-').startsWith(targetLocale.toLowerCase()) ||
      v.lang.toLowerCase().startsWith(langPrefix) ||
      v.name.toLowerCase().includes(langPrefix)
    ) || availableVoices.find(v => v.lang.includes('IN')) || availableVoices[0];

    if (matchedVoice) utterance.voice = matchedVoice;
    
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  // Stop recognition manually
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Failed to stop recognition:", e);
      }
    }
    setIsListening(false);
  }, []);

  // Speech-to-Text (Mic Input)
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Browser does not support Speech Recognition.");
      return;
    }

    // Stop any existing instance before starting a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition; // Store in ref to survive re-renders

    const targetLang = langCodeRef.current || 'hi';
    const targetLocale = speechLocales[targetLang] || 'hi-IN';
    recognition.lang = targetLocale;
    recognition.continuous = false; // MUST BE FALSE to prevent rapid on/off toggling loops
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log(`Mic started (${targetLocale})`);
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentText += event.results[i][0].transcript;
      }
      if (onTextCapturedRef.current && currentText) {
        onTextCapturedRef.current(currentText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Mic error:", event.error);
      setIsListening(false);
      // REMOVED ALERTS: Alerts block the main thread and cause UI freezes.
      // The network error usually happens if the user is on Brave Browser.
    };

    recognition.onend = () => {
      console.log("Mic ended naturally");
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsListening(false);
    }
  }, []);

  return { isListening, startListening, stopListening, speak };
};
