'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
// Language handling now comes from useInteraction
import { useToast } from '../context/ToastContext';
import { useInteraction } from '../hooks/useInteraction';
import { useVideoManager } from '../hooks/useVideoManager';
import { interactionService } from '../services/interactionService';
import type { Message } from '../types/message';
import type { VideoState } from '../types';
import type { SupportedLanguage } from '../types/language';
import VoiceInput from '../components/VoiceInput';
import ImageUpload from '../components/ImageUpload';
import ToastManager from '../components/ToastManager';

export default function CallPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [supportedLanguages] = useState<SupportedLanguage[]>(
    interactionService.getSupportedLanguages()
  );
  
  const interaction = useInteraction({
    onError: (error) => {
      console.error('Interaction error:', error);
      showToast(error.message, 'error');
    }
  });

  const videoManager = useVideoManager();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const selectedAvatarId = typeof window !== 'undefined' 
    ? localStorage.getItem('selectedAvatar') 
    : null;

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const processImageInput = async (file: File): Promise<string> => {
    const result = await interaction.processInput(file, 'image');
    return result.text;
  };

  const handleUserInput = async (input: string | File) => {
    try {
      // Check for interruptions first
      if (interaction.state.interruptCount >= 3) {
        showToast('Please let me finish my current response', 'warning');
        return;
      }

      // Stop current response if any, signaling this is a user interrupt
      videoManager.interruptCurrentVideo(true);

      // Process the input
      let result;
      if (input instanceof File) {
        const processedText = await processImageInput(input);
        result = await interaction.processInput(processedText, 'text');
      } else {
        result = await interaction.processInput(input, 'text');
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: input instanceof File ? `[Image: ${input.name}]` : input,
        sender: 'user',
        timestamp: Date.now(),
        language: interaction.state.currentLanguage
      };
      setMessages(prev => [...prev, userMessage]);

      // Add AI message
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: result.text,
        sender: 'ai',
        timestamp: Date.now(),
        language: result.language
      };
      setMessages(prev => [...prev, aiMessage]);

      // Update video
      if (selectedAvatarId) {
        await videoManager.playResponse(result.text, result.language);
      }

    } catch (error) {
      console.error('Error handling user input:', error);
      showToast((error as Error).message, 'error');
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle transcribed voice input from interaction service
  useEffect(() => {
    if (interaction.state.transcribedText) {
      handleUserInput(interaction.state.transcribedText);
    }
  }, [interaction.state.transcribedText]);

  // Set up video manager with avatar
  useEffect(() => {
    if (selectedAvatarId) {
      videoManager.setCurrentAvatar(selectedAvatarId);
    }
  }, [selectedAvatarId]);

  if (!selectedAvatarId) {
    router.push('/avatar');
    return null;
  }

  const isDisabled = interaction.state.isProcessing || isListening;

  return (
    <main className={`min-h-screen ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Avatar Video */}
        <div className="relative aspect-video w-full max-h-[60vh] rounded-2xl overflow-hidden 
          shadow-lg mb-6">
          <video
            ref={videoManager.videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>

        {/* Chat Container */}
        <div 
          ref={chatContainerRef}
          className={`flex-1 overflow-y-auto rounded-lg p-4 mb-4
            ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg px-4 py-2
                ${message.sender === 'user' 
                  ? darkMode 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-100 text-blue-900'
                  : darkMode
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-white text-gray-900 shadow-sm'}`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 
                  ${message.sender === 'user' 
                    ? darkMode ? 'text-blue-200' : 'text-blue-700'
                    : darkMode ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  {supportedLanguages.find(l => l.code === message.language)?.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Controls */}
        <div className="flex items-center gap-4">
          <ImageUpload
            onImageSelect={(file) => handleUserInput(file)}
            disabled={isDisabled}
          />
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && textInput.trim() && !isDisabled) {
                handleUserInput(textInput);
                setTextInput('');
              }
            }}
            placeholder={`Type a message in ${supportedLanguages.find(l => l.code === interaction.state.currentLanguage)?.name}...`}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors
              ${darkMode
                ? 'bg-gray-900 text-gray-300 border border-gray-800 focus:border-gray-700'
                : 'bg-white text-gray-700 border border-gray-200 focus:border-gray-300'}`}
            disabled={isDisabled}
          />
          <button
            onClick={() => setIsListening(!isListening)}
            className={`p-4 rounded-full transition-all duration-200
              ${isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : `${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}`}
            disabled={interaction.state.isProcessing}
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" 
                 strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          <select
            value={interaction.state.currentLanguage}
            onChange={(e) => interaction.setLanguage(e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${darkMode 
                ? 'bg-gray-900 text-gray-300 border border-gray-800' 
                : 'bg-white text-gray-700 border border-gray-200'}`}
            disabled={isDisabled}
          >
            {supportedLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <VoiceInput
          isListening={isListening}
          onListeningChange={setIsListening}
          className="sr-only"
        />
        <ToastManager />
      </div>
    </main>
  );
}