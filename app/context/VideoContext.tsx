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
    id: 'sarah', 
    name: 'Sarah', 
    description: 'Friendly and professional', 
    previewUrl: '/avatars/sarah/preview.png',
    languages: ['en', 'sw', 'es']
  },
  { 
    id: 'michael', 
    name: 'Michael', 
    description: 'Confident and direct', 
    previewUrl: '/avatars/michael/preview.png',
    languages: ['en', 'sw']
  },
  { 
    id: 'james', 
    name: 'James', 
    description: 'Warm and empathetic', 
    previewUrl: '/avatars/james/preview.png',
    languages: ['en', 'es']
  },
  { 
    id: 'emily', 
    name: 'Emily', 
    description: 'Technical expert', 
    previewUrl: '/avatars/emily/preview.png',
    languages: ['en', 'es']
  },
  { 
    id: 'lisa', 
    name: 'Lisa', 
    description: 'Creative and dynamic', 
    previewUrl: '/avatars/lisa/preview.png',
    languages: ['en', 'sw', 'es']
  },
  { 
    id: 'david', 
    name: 'David', 
    description: 'Analytical and precise', 
    previewUrl: '/avatars/david/preview.png',
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