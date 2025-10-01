'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useVideo, useAvatars, type Avatar } from '../context/VideoContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import VoiceInput from '../components/VoiceInput';



function AvatarCard({ avatar, isSelected, onSelect, isLoading }: {
  avatar: Avatar;
  isSelected: boolean;
  onSelect: (avatar: Avatar) => void;
  isLoading: boolean;
}) {
  const { darkMode } = useTheme();

  return (
    <button
      onClick={() => onSelect(avatar)}
      className={`group relative aspect-video w-full rounded-xl overflow-hidden transition-all duration-200
        ${isSelected 
          ? 'ring-4 ring-blue-500 scale-[1.02]' 
          : 'hover:scale-[1.01] focus:scale-[1.01]'}
        ${darkMode ? 'bg-gray-800' : 'bg-white'}
        shadow-lg hover:shadow-xl focus:shadow-xl`}
    >
      <Image
        src={avatar.previewUrl}
        alt={avatar.name}
        className="object-cover w-full h-full transition-opacity duration-200 
          group-hover:opacity-90"
        width={320}
        height={180}
        priority
      />
      <div className={`absolute bottom-0 left-0 right-0 p-4
        bg-gradient-to-t ${darkMode 
          ? 'from-black/80 to-transparent' 
          : 'from-white/80 to-transparent'}`}
      >
        <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {avatar.name}
        </h3>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {avatar.description}
        </p>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center 
          bg-black/50 rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        </div>
      )}
    </button>
  );
}

export default function AvatarSelectionPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { 
    currentAvatarId,
    videoState,
    isLoading,
    setCurrentAvatar,
    playGreeting,
    videoRef
  } = useVideo();
  const avatars = useAvatars();

  const { 
    supportedLanguages, 
    detectedLanguage, 
    setDetectedLanguage,
    isProcessingVoice, 
    transcribedText 
  } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const webcamRef = useRef<HTMLVideoElement>(null);

  // Initialize camera and mic permissions
  const requestPermissions = async () => {
    try {
      setPermissionError(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setStream(mediaStream);
      setHasPermissions(true);
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setPermissionError(true);
    }
  };

  // Cleanup media streams
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle avatar selection
  const handleSelectAvatar = async (avatar: Avatar) => {
    try {
      await setCurrentAvatar(avatar.id);
      await playGreeting(avatar.id);
      
      // Only navigate after greeting starts playing
      router.push('/call');
    } catch (error) {
      console.error('Error selecting avatar:', error);
      // TODO: Show error toast
    }
  };

  // Check for existing selection
  useEffect(() => {
    const savedAvatarId = typeof window !== 'undefined' 
      ? localStorage.getItem('selectedAvatar')
      : null;
      
    if (savedAvatarId) {
      router.push('/call');
    }
  }, [router]);

  return (
    <main className={`min-h-screen ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 
            ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Choose Your Avatar
          </h1>
          <p className={`text-xl 
            ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Select an AI companion that matches your style
          </p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <select
              value={detectedLanguage}
              onChange={(e) => setDetectedLanguage(e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${darkMode 
                  ? 'bg-gray-900 text-gray-300 border border-gray-800' 
                  : 'bg-white text-gray-700 border border-gray-200'}`}
            >
              {supportedLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Permission Error Alert */}
        {permissionError && (
          <div className={`max-w-md mx-auto mb-8 px-4 py-3 rounded-lg text-center
            ${darkMode 
              ? 'bg-red-900/20 border border-red-800/50' 
              : 'bg-red-50 border border-red-200'}`}
          >
            <p className={`text-base ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              Camera and microphone access is required to continue
            </p>
            <button
              onClick={requestPermissions}
              className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium
                ${darkMode 
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                  : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
            >
              Allow Access
            </button>
          </div>
        )}

        {/* Avatar Grid */}
        {avatars.length === 0 ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative aspect-video rounded-xl overflow-hidden">
                <div className={`w-full h-full animate-pulse 
                  ${darkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avatars.map(avatar => (
              <div key={avatar.id} className="relative">
                <AvatarCard
                  avatar={avatar}
                  isSelected={avatar.id === currentAvatarId}
                  onSelect={handleSelectAvatar}
                  isLoading={isLoading && avatar.id === currentAvatarId}
                />
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 text-center">
          {!hasPermissions ? (
            <button
              onClick={requestPermissions}
              aria-label="Enable camera and microphone access"
              className={`px-8 py-3 rounded-lg text-lg font-medium
                transition-all duration-200 transform flex items-center justify-center gap-2
                ${darkMode 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}
                active:scale-[0.98]`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Enable Camera & Mic</span>
            </button>
          ) : (
            <button
              onClick={() => currentAvatarId && router.push('/call')}
              disabled={!currentAvatarId}
              aria-label={currentAvatarId ? "Start video call" : "Select an avatar first"}
              className={`px-8 py-3 rounded-lg text-lg font-medium
                transition-all duration-200 transform flex items-center justify-center gap-2
                ${currentAvatarId
                  ? `${darkMode 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'}
                     active:scale-[0.98]`
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Start Call</span>
            </button>
          )}
        </div>

        {/* Webcam Preview */}
        {hasPermissions && (
          <div className="fixed bottom-6 right-6 w-1/5 min-w-[240px] max-w-[320px] 
            aspect-video rounded-lg overflow-hidden shadow-lg">
            <video
              ref={webcamRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Hidden Video Element for Preloading */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted
        />
      </div>
    </main>
  );
}