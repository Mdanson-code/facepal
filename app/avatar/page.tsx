'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useVideo, useAvatars, type Avatar } from '../context/VideoContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import VoiceInput from '../components/VoiceInput';



export default function AvatarSelectionPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { supportedLanguages, detectedLanguage, setDetectedLanguage, isProcessingVoice, transcribedText } = useLanguage();
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [avatars, setAvatars] = useState<AvatarWithLoadState[]>(AVATARS_WITH_STATE);
  const [preloading, setPreloading] = useState(true);
  
  const webcamRef = useRef<HTMLVideoElement>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  // Request camera and microphone permissions
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

  // Cleanup function for media streams
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Preload and track loading state of avatar videos
  useEffect(() => {
    const preloadVideos = async () => {
      setPreloading(true);
      
      const preloadPromises = avatars.map((avatar, index) => {
        return new Promise<void>((resolve, reject) => {
          // Preload both idle and greeting videos
          const idleVideo = document.createElement('video');
          const greetingVideo = document.createElement('video');
          
          // Configure video elements
          [idleVideo, greetingVideo].forEach(video => {
            video.preload = 'auto';
            video.muted = true;
            video.playsInline = true;
          });
          
          idleVideo.src = avatar.idleUrl;
          greetingVideo.src = avatar.greetingUrl;
          
          // Track loading progress
          let loadedCount = 0;
          const handleLoad = () => {
            loadedCount++;
            if (loadedCount === 2) {
              setAvatars(prev => prev.map(a => 
                a.id === avatar.id ? { ...a, loadState: 'loaded' } : a
              ));
              
              // Start playing preview if ref exists
              if (videoRefs.current[index]) {
                videoRefs.current[index]?.play().catch(console.error);
              }
              resolve();
            }
          };
          
          const handleError = () => {
            setAvatars(prev => prev.map(a => 
              a.id === avatar.id ? { ...a, loadState: 'error' } : a
            ));
            reject();
          };
          
          // Add event listeners
          idleVideo.addEventListener('canplaythrough', handleLoad);
          greetingVideo.addEventListener('canplaythrough', handleLoad);
          idleVideo.addEventListener('error', handleError);
          greetingVideo.addEventListener('error', handleError);
          
          // Start loading
          idleVideo.load();
          greetingVideo.load();
        });
      });

      try {
        await Promise.all(preloadPromises);
        console.log('All avatar videos preloaded successfully');
      } catch (error) {
        console.error('Error preloading avatar videos:', error);
      } finally {
        setPreloading(false);
      }
    };

    preloadVideos();

    // Cleanup
    return () => {
      videoRefs.current.forEach(videoRef => {
        if (videoRef) {
          videoRef.pause();
          videoRef.src = '';
          videoRef.load();
        }
      });
    };
  }, []);

  const handleJoinCall = () => {
    if (selectedAvatar && hasPermissions) {
      // Store full avatar data for call page
      localStorage.setItem('selectedAvatar', JSON.stringify(selectedAvatar));
      router.push('/call');
    }
  };

  return (
    <main className={`min-h-screen transition-colors ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto px-4 py-12 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className={`text-sm font-semibold tracking-wide mb-4 
            ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            CHOOSE YOUR AVATAR
          </h1>
          <p className={`text-lg font-light 
            ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Select an AI avatar for your video call
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
            <button
              onClick={() => setIsListening(!isListening)}
              className={`p-3 rounded-full transition-all duration-200
                ${isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : `${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}`}
            >
              <svg className="w-5 h-5" fill="none" strokeLinecap="round" 
                   strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
          <VoiceInput
            isListening={isListening}
            onListeningChange={setIsListening}
            className="mt-4"
          />
          {isProcessingVoice && (
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Processing voice input...
            </p>
          )}
          {transcribedText && (
            <p className={`mt-2 text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {transcribedText}
            </p>
          )}
        </div>

        {/* Permission Error Alert */}
        {permissionError && (
          <div className={`max-w-md mx-auto mb-8 px-4 py-3 rounded-lg text-center border
            ${darkMode 
              ? 'bg-red-900/20 border-red-800/50' 
              : 'bg-red-50 border-red-200'}`}>
            <p className={`mb-3 text-base
              ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              Camera and microphone are required to join the call.
            </p>
            <button
              onClick={requestPermissions}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200
                ${darkMode 
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                  : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {preloading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-video rounded-lg bg-gray-800/50" />
            ))}
          </div>
        ) : (
          /* Avatar Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {avatars.map((avatar, index) => (
            <div 
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar)}
              className={`group aspect-video rounded-lg overflow-hidden cursor-pointer 
                transition-all duration-300 ease-out transform
                ${selectedAvatar?.id === avatar.id 
                  ? `ring-4 ${darkMode ? 'ring-blue-400 scale-[1.02]' : 'ring-blue-500 scale-[1.02]'}`
                  : `ring-1 ${darkMode 
                      ? 'ring-gray-800 hover:ring-gray-700' 
                      : 'ring-gray-200 hover:ring-gray-300'} hover:scale-[1.01]`
                }`}
            >
              {/* Loading Shimmer */}
              {avatar.loadState === 'loading' && (
                <div className={`w-full h-full animate-pulse
                  ${darkMode ? 'bg-gray-800/80' : 'bg-gray-100'}`}>
                  <div className="h-full flex items-center justify-center">
                    <svg className={`w-8 h-8 animate-spin ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} 
                         xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                      </path>
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Error State */}
              {avatar.loadState === 'error' && (
                <div className={`w-full h-full flex items-center justify-center
                  ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  <span className="text-sm">Failed to load</span>
                </div>
              )}
              
              {/* Avatar Video */}
              <video 
                ref={(el) => { videoRefs.current[index] = el }}
                src={avatar.videoUrl}
                className={`w-full h-full object-cover transition-all duration-300
                  ${avatar.loadState === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-16 text-center">
          {!hasPermissions ? (
            <button
              onClick={requestPermissions}
              disabled={selectedAvatar === null}
              className={`inline-flex items-center space-x-2 px-8 py-3.5 rounded-lg text-lg
                transition-all duration-200 ease-out transform
                ${selectedAvatar !== null
                  ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800/50'
                }`}
            >
              <span>Enable Camera & Mic</span>
            </button>
          ) : (
            <button
              onClick={handleJoinCall}
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-lg text-lg
                bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 
                ease-out transform active:scale-[0.98]"
            >
              <span>Join Call</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Webcam Preview */}
        {hasPermissions && (
          <div className={`fixed bottom-6 right-6 w-1/5 min-w-[240px] max-w-[320px] 
            aspect-video rounded-lg overflow-hidden shadow-lg 
            transition-all duration-300 ease-out transform origin-bottom-right
            backdrop-blur-sm backdrop-saturate-150 ring-1
            ${darkMode 
              ? 'ring-white/10 shadow-black/20' 
              : 'ring-black/10 shadow-black/5'}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 
              transition-opacity duration-300 group-hover:opacity-100" />
            <video
              ref={webcamRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </main>
  );
}