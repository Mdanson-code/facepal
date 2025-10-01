'use client';

import { createContext, useContext } from 'react';
import { useVideoManager } from '../hooks/useVideoManager';
import type { VideoState, Avatar, VideoManagerState } from '../services/videoManager';

type VideoContextValue = VideoManagerState & {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  setCurrentAvatar: (avatarId: string) => Promise<void>;
  playGreeting: (avatarId: string) => Promise<void>;
  switchToIdle: () => void;
  playResponse: (responseUrl: string) => Promise<void>;
  interruptCurrentVideo: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
};

const VideoContext = createContext<VideoContextValue | null>(null);

const AVATARS: Avatar[] = [
  { 
    id: '1', 
    name: 'Emma', 
    description: 'Friendly and professional', 
    previewUrl: '/avatars/1/preview.jpg',
    languages: ['en', 'sw', 'es']
  },
  { 
    id: '2', 
    name: 'James', 
    description: 'Confident and direct', 
    previewUrl: '/avatars/2/preview.jpg',
    languages: ['en', 'sw']
  },
  { 
    id: '3', 
    name: 'Sophia', 
    description: 'Warm and empathetic', 
    previewUrl: '/avatars/3/preview.jpg',
    languages: ['en', 'es']
  },
  { 
    id: '4', 
    name: 'Lucas', 
    description: 'Technical expert', 
    previewUrl: '/avatars/4/preview.jpg',
    languages: ['en', 'es']
  },
  { 
    id: '5', 
    name: 'Ava', 
    description: 'Creative and dynamic', 
    previewUrl: '/avatars/5/preview.jpg',
    languages: ['en', 'sw', 'es']
  },
  { 
    id: '6', 
    name: 'Noah', 
    description: 'Analytical and precise', 
    previewUrl: '/avatars/6/preview.jpg',
    languages: ['en', 'es']
  }
];

interface VideoProviderProps {
  children: React.ReactNode;
}

export { type VideoState, type Avatar };

export function VideoProvider({ children }: VideoProviderProps) {
  const videoManagerState = useVideoManager();

  return (
    <VideoContext.Provider value={videoManagerState}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within VideoProvider');
  }
  return context;
}

export function useAvatars() {
  return AVATARS;
}