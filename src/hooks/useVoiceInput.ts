/**
 * useVoiceInput Hook
 * Natural language water logging via Web Speech API
 */
import i18n from '@/i18n';
import { useState, useCallback, useRef } from 'react';

interface VoiceInputResult {
  transcript: string;
  amountMl: number | null;
  success: boolean;
}

type VoiceInputState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

export function useVoiceInput() {
  const [state, setState] = useState<VoiceInputState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const parseVoiceAmount = (text: string): number | null => {
    const lower = text.toLowerCase();

    // Number patterns
    const numberPatterns = [
      /(\d+)\s*(ml|milliliter)/i,
      /(\d+)\s*(l|liter)/i,
      /mot\s*(\d+)\s*ml/i,
      /hai\s*(\d+)\s*ml/i,
      /ba\s*(\d+)\s*ml/i,
      /(\d+)\s*cup/i,
      /(\d+)\s*glass/i,
    ];

    for (const pattern of numberPatterns) {
      const match = lower.match(pattern);
      if (match) {
        let amount = parseInt(match[1], 10);
        if (pattern.source.includes('l|liter')) {
          amount *= 1000; // Convert liters to ml
        }
        if (pattern.source.includes('cup')) {
          amount *= 240; // Approximate cup size
        }
        if (pattern.source.includes('glass')) {
          amount *= 250; // Approximate glass size
        }
        return amount;
      }
    }

    // Vietnamese words
    if (lower.includes('một ly') || lower.includes('mot ly')) return 250;
    if (lower.includes('một cốc') || lower.includes('mot coc')) return 240;
    if (lower.includes('nửa l') || lower.includes('nua l')) return 500;
    if (lower.includes('một l') || lower.includes('mot l')) return 1000;

    return null;
  };

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError(i18n.t('auth.voice_not_supported'));
      setState('error');
      return;
    }

    setState('listening');
    setTranscript('');
    setError(null);

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const transcriptText = results.map(r => r[0].transcript).join('');

      setTranscript(transcriptText);

      if (results[0].isFinal) {
        const amount = parseVoiceAmount(transcriptText);
        setState('success');
        console.log('[VoiceInput] Final transcript:', transcriptText, 'Parsed amount:', amount);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[VoiceInput] Error:', event.error);
      setError(`Lỗi nhận dạng giọng nói: ${event.error}`);
      setState('error');
    };

    recognition.onend = () => {
      if (state === 'listening') {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState('idle');
  }, []);

  const processTranscript = useCallback((): VoiceInputResult => {
    const amount = parseVoiceAmount(transcript);
    return {
      transcript,
      amountMl: amount,
      success: amount !== null,
    };
  }, [transcript]);

  return {
    state,
    transcript,
    error,
    startListening,
    stopListening,
    processTranscript,
    parseVoiceAmount,
  };
}

// Type declarations for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
