import { useState, useEffect, useCallback } from 'react';

/**
 * useKrishiVoice Hook
 * Manages asynchronous voice loading, sanitized Hindi TTS output,
 * and robust Speech-to-Text via Web Speech Recognition API.
 */
export const useKrishiVoice = (onTextCaptured?: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // 1. Load Voices Asynchronously (Fixes the TTS issue in Chrome/Safari)
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

  // 2. Text to Speech (Sanitized for Hindi phonetics)
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    
    // Sanitize text (remove # and symbols that break Hindi TTS engines)
    const sanitizedText = text
      .replace(/#/g, '')
      .replace(/-/g, ' ')
      .replace(/₹/g, 'रुपये ')
      .replace(/[*_~`]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(sanitizedText);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9; // Slightly slower for farmers to understand clearly
    utterance.pitch = 1.0;
    
    // Try to set a Hindi voice if available
    const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const hindiVoice = availableVoices.find(v => 
      v.lang.includes('hi-IN') || 
      v.lang.includes('hi_IN') || 
      v.lang.toLowerCase() === 'hi' ||
      v.name.toLowerCase().includes('hindi')
    );

    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  // 3. Speech to Text (Mic Input)
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("आपका ब्राउज़र वॉइस सपोर्ट नहीं करता। कृपया Google Chrome का इस्तेमाल करें।");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (onTextCaptured) {
        onTextCaptured(transcript); // Send text back to component
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Mic error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    
    try {
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition already running or failed to start:", err);
      setIsListening(false);
    }
  }, [onTextCaptured]);

  return { isListening, startListening, speak };
};
