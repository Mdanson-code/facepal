import { useEffect, useState, useCallback } from 'react';
import { interactionService, ProcessingResult, InteractionState } from '../services/interactionService';
import type { SupportedLanguage } from '../types/language';

interface UseInteractionProps {
  onStateChange?: (state: InteractionState) => void;
  onResult?: (result: ProcessingResult) => void;
  onError?: (error: Error) => void;
}

export function useInteraction({
  onStateChange,
  onResult,
  onError
}: UseInteractionProps = {}) {
  const [state, setState] = useState<InteractionState>(interactionService.getState());
  const [supportedLanguages] = useState<SupportedLanguage[]>(
    interactionService.getSupportedLanguages()
  );
  
  useEffect(() => {
    const unsubscribe = interactionService.onStateChange((newState) => {
      setState(newState);
      onStateChange?.(newState);
    });
    return unsubscribe;
  }, [onStateChange]);

  const processInput = useCallback(async (
    input: string | Blob | File,
    type: 'text' | 'voice' | 'image',
    language?: string
  ) => {
    try {
      const result = await interactionService.processInput(input, type, language);
      onResult?.(result);
      return result;
    } catch (error) {
      const err = error as Error;
      onError?.(err);
      throw err;
    }
  }, [onResult, onError]);

  const setLanguage = useCallback((language: string) => {
    interactionService.setLanguage(language);
  }, []);

  const translateText = useCallback(async (text: string, targetLang: string) => {
    return interactionService.translateText(text, targetLang);
  }, []);

  const interrupt = useCallback(() => {
    interactionService.interrupt();
  }, []);

  const clearQueue = useCallback(() => {
    interactionService.clearQueue();
  }, []);

  const reset = useCallback(() => {
    interactionService.reset();
  }, []);

  return {
    state,
    processInput,
    setLanguage,
    translateText,
    supportedLanguages,
    interrupt,
    clearQueue,
    reset,
    isProcessing: state.isProcessing,
    currentLanguage: state.currentLanguage,
    inputQueue: state.inputQueue,
    detectedLanguage: state.currentLanguage // For backward compatibility
  };
}