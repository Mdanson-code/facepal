'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface LanguageContextType {
  detectedLanguage: string;
  supportedLanguages: { code: string; name: string }[];
  isProcessingVoice: boolean;
  transcribedText: string | null;
  setDetectedLanguage: (lang: string) => void;
  setTranscribedText: (text: string | null) => void;
  setIsProcessingVoice: (isProcessing: boolean) => void;
  translateText: (text: string, targetLang: string) => Promise<string>;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Swahili' },
  { code: 'es', name: 'Spanish' }
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);

  // Translation function using URL endpoints
  const translateText = useCallback(async (text: string, targetLang: string): Promise<string> => {
    try {
      // Example URL pattern - replace with your actual translation service URL
      const translationUrl = `https://translate.facepal.ai/${targetLang}?text=${encodeURIComponent(text)}`;
      
      // For demo purposes, simulate translation with language prefix
      const translations: { [key: string]: string } = {
        en: text,
        es: `[ES] ${text}`,
        sw: `[SW] ${text}`
      };
      
      return translations[targetLang] || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }, []);

  const value = {
    detectedLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isProcessingVoice,
    transcribedText,
    setDetectedLanguage,
    setTranscribedText,
    setIsProcessingVoice,
    translateText
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}