'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceInputProps {
  onInputProcessed?: (text: string) => void;
  isListening?: boolean;
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
}

export default function VoiceInput({
  onInputProcessed,
  isListening: externalIsListening,
  onListeningChange,
  className = ''
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  
  const { setIsProcessingVoice, setTranscribedText } = useLanguage();

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        await processAudioInput(audioBlob);
      };

      mediaRecorder.current.start();
      setIsListening(true);
      onListeningChange?.(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsListening(false);
      onListeningChange?.(false);
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    try {
      setIsProcessingVoice(true);
      
      // Use AI service to process voice input
      const { text, language } = await aiService.processVoiceInput(audioBlob);
      
      // Update transcribed text and detected language
      setTranscribedText(text);
      onInputProcessed?.(text);
      
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Could not process audio. Please try again.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  useEffect(() => {
    if (externalIsListening !== undefined) {
      if (externalIsListening) {
        startListening();
      } else {
        stopListening();
      }
    }
  }, [externalIsListening]);

  useEffect(() => {
    return () => {
      if (mediaRecorder.current) {
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className={className}>
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
    </div>
  );
}