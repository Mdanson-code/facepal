'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useVideo } from '../context/VideoContext';
import { useToast } from '../context/ToastContext';
import { videoService } from '../services/videoService';
import { aiService } from '../services/aiService';
import { interactionManager } from '../services/interactionManager';
import type { Message } from '../types/message';
import type { VideoState } from '../types';
import VoiceInput from '../components/VoiceInput';
import ImageUpload from '../components/ImageUpload';
import ToastManager from '../components/ToastManager';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useVideo } from '../context/VideoContext';
import { useToast } from '../context/ToastContext';
import { videoService } from '../services/videoService';
import { aiService } from '../services/aiService';
import { interactionManager } from '../services/interactionManager';
import { preloadVideo, cleanupVideo } from '../services/videoService';
import { useInteractionManager } from '../services/interactionManager';
import { generateAIResponse } from '../services/aiService';
import type { Message } from '../types/message';
import type { Toast, VideoState } from '../types';
import VoiceInput from '../components/VoiceInput';
import ImageUpload from '../components/ImageUpload';
import ToastManager from '../components/ToastManager';

interface VideoResponse {
  videoUrl: string;
  cached: boolean;
}

export default function CallPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const { 
    detectedLanguage, 
    setDetectedLanguage,
    supportedLanguages,
    isProcessingVoice,
    transcribedText,
    setTranscribedText 
  } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [avatarVideoState, setAvatarVideoState] = useState<VideoState>('idle');
  const [textInput, setTextInput] = useState('');
  const selectedAvatarId = typeof window !== 'undefined' 
    ? localStorage.getItem('selectedAvatar') 
    : null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handle new user input (text or voice)
  const processImageInput = async (file: File): Promise<string> => {
    return `[Image uploaded: ${file.name}]`;
  };

  const handleUserInput = async (input: string | File) => {
    let processedText = '';
    const interaction = useInteractionManager();
    
    try {
      if (input instanceof File) {
        processedText = await processImageInput(input);
      } else {
        processedText = input;
      }

      // Handle interruptions
      if (interaction.state.interruptCount > 3) {
        showToast('Please let me finish my response first! �', 'warning');
        return;
      }

      // Stop current response if any
      if (videoRef.current && selectedAvatarId) {
        cleanupVideo(videoRef.current);
        const idleVideoUrl = `/avatars/${selectedAvatarId}/idle.mp4`;
        videoRef.current.src = idleVideoUrl;
        setAvatarVideoState('idle');
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: processedText,
        sender: 'user',
        timestamp: Date.now(),
        language: detectedLanguage
      };
      setMessages(prev => [...prev, userMessage]);

      // Generate AI response
      setIsGeneratingResponse(true);

      // Generate AI response
      const aiResponse = await generateAIResponse(processedText, detectedLanguage);
      
      // Add AI message
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse.text,
        sender: 'ai',
        timestamp: Date.now(),
        language: aiResponse.language
      };
      setMessages(prev => [...prev, aiMessage]);

      // Update video source and state
      if (videoRef.current) {
        videoRef.current.src = aiResponse.videoUrl;
        setAvatarVideoState('responding');
        
        // Listen for video end to switch back to idle
        videoRef.current.onended = () => {
          if (videoRef.current && selectedAvatarId) {
            const idleVideoUrl = `/avatars/${selectedAvatarId}/idle.mp4`;
            videoRef.current.src = idleVideoUrl;
            setAvatarVideoState('idle');
          }
        };
      }
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle transcribed voice input
  useEffect(() => {
    if (transcribedText) {
      handleUserInput(transcribedText);
    }
  }, [transcribedText]);

  // Preload idle video on mount and cleanup on unmount
  useEffect(() => {
    if (selectedAvatarId && videoRef.current) {
      const idleVideoUrl = `/avatars/${selectedAvatarId}/idle.mp4`;
      preloadVideo(idleVideoUrl)
        .then(() => {
          if (videoRef.current) {
            videoRef.current.src = idleVideoUrl;
          }
        })
        .catch((error: Error) => {
          console.error('Error preloading idle video:', error);
        });
    }

    return () => {
      cleanupVideo(videoRef.current);
    };
  }, [selectedAvatarId]);

  if (!selectedAvatarId) {
    router.push('/avatar');
    return null;
  }


  return (
    <main className={`min-h-screen ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Avatar Video */}
        <div className="relative aspect-video w-full max-h-[60vh] rounded-2xl overflow-hidden 
          shadow-lg mb-6">
          <video
            ref={videoRef}
            src={`/avatars/${selectedAvatarId}-${avatarVideoState}.mp4`}
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
          {messages.map((message, index) => (
            <div
              key={index}
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
            disabled={isGeneratingResponse || isListening}
          />
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && textInput.trim() && !isGeneratingResponse) {
                handleUserInput(textInput);
                setTextInput('');
              }
            }}
            placeholder={`Type a message in ${supportedLanguages.find(l => l.code === detectedLanguage)?.name}...`}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors
              ${darkMode
                ? 'bg-gray-900 text-gray-300 border border-gray-800 focus:border-gray-700'
                : 'bg-white text-gray-700 border border-gray-200 focus:border-gray-300'}`}
            disabled={isGeneratingResponse || isListening}
          />
          <button
            onClick={() => setIsListening(!isListening)}
            className={`p-4 rounded-full transition-all duration-200
              ${isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : `${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}`}
            disabled={isGeneratingResponse}
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" 
                 strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          <select
            value={detectedLanguage}
            onChange={(e) => setDetectedLanguage(e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${darkMode 
                ? 'bg-gray-900 text-gray-300 border border-gray-800' 
                : 'bg-white text-gray-700 border border-gray-200'}`}
            disabled={isGeneratingResponse || isListening}
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