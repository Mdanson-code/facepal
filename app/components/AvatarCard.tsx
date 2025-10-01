import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useVideo } from '@/app/context/VideoContext';
import type { Avatar } from '@/app/types';
import Image from 'next/image';

interface AvatarCardProps {
  avatar: Avatar;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: (avatarId: string) => void;
}

export function AvatarCard({
  avatar,
  isSelected,
  isLoading,
  onSelect
}: AvatarCardProps) {
  const { darkMode } = useTheme();
  const { videoState } = useVideo();
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Preload idle video
  useEffect(() => {
    const video = videoRef.current;
    if (video && avatar.videoUrls.idle) {
      // Create a new video element for preloading
      const preloadVideo = document.createElement('video');
      preloadVideo.src = avatar.videoUrls.idle;
      preloadVideo.load();

      // Set up event listeners
      video.addEventListener('loadeddata', () => setIsVideoReady(true));
      video.addEventListener('error', () => {
        console.error('Error loading video:', avatar.id);
        setIsVideoReady(false);
      });

      // Start playing when ready
      video.src = avatar.videoUrls.idle;
      video.load();
      video.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }

    // Cleanup on unmount
    return () => {
      if (video) {
        video.pause();
        video.src = '';
        video.load();
        setIsVideoReady(false);
      }
    };
  }, [avatar.id, avatar.videoUrls.idle]);

  return (
    <div
      onClick={() => !isLoading && onSelect(avatar.id)}
      className={`group relative aspect-video rounded-xl overflow-hidden cursor-pointer
        transition-all duration-300 ease-out transform backdrop-blur-sm
        ${isSelected
          ? `ring-4 ${darkMode ? 'ring-blue-400' : 'ring-blue-500'} scale-[1.02]`
          : `ring-1 ${darkMode
              ? 'ring-gray-800 hover:ring-gray-700'
              : 'ring-gray-200 hover:ring-gray-300'
            } hover:scale-[1.01]`
        }`}
    >
      {/* Initial Preview Image */}
      <Image
        src={avatar.previewUrl}
        alt={avatar.name}
        className={`absolute inset-0 w-full h-full object-cover
          transition-opacity duration-500
          ${isVideoReady ? 'opacity-0' : 'opacity-100'}`}
        width={480}
        height={270}
        priority={isSelected}
      />

      {/* Loading State */}
      {(isLoading || !isVideoReady) && (
        <div className={`absolute inset-0 flex items-center justify-center
          ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'} z-10
          transition-opacity duration-300
          ${isLoading ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 
              border-gray-300 border-t-blue-500" 
            />
            {isLoading && (
              <div className={`absolute -bottom-8 text-sm font-medium
                ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Loading...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Preview */}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover
          transition-opacity duration-500
          ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
        muted
        loop
        playsInline
      />

      {/* Hover & Selection Effects */}
      <div className={`absolute inset-0 transition-opacity duration-200
        ${darkMode ? 'bg-black/30' : 'bg-white/30'}
        ${isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
      />

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className={`rounded-full p-2
            ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Avatar Info */}
      <div className={`absolute bottom-0 left-0 right-0 p-4
        bg-gradient-to-t ${darkMode 
          ? 'from-black/90 via-black/50 to-transparent' 
          : 'from-white/90 via-white/50 to-transparent'}`}
      >
        <p className={`text-lg font-medium
          ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {avatar.name}
        </p>
        {avatar.description && (
          <p className={`text-sm mt-1
            ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            {avatar.description}
          </p>
        )}
        
        {/* Language Badges */}
        {avatar.languages?.length > 0 && (
          <div className="flex gap-2 mt-2">
            {avatar.languages.map(lang => (
              <span key={lang}
                className={`text-xs px-2 py-1 rounded-full
                  ${darkMode 
                    ? 'bg-gray-800 text-gray-300' 
                    : 'bg-gray-100 text-gray-600'}`}
              >
                {lang}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}