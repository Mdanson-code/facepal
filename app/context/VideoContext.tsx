'use client';

import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

export type VideoState = 'greeting' | 'idle' | 'response';

export interface Avatar {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
}

export interface VideoContextState {
  currentAvatarId: string | null;
  videoState: VideoState;
  isLoading: boolean;
  isMuted: boolean;
  volume: number;
}

interface VideoContextValue extends VideoContextState {
  setCurrentAvatar: (avatarId: string) => Promise<void>;
  playGreeting: (avatarId: string) => Promise<void>;
  switchToIdle: () => void;
  playResponse: (responseUrl: string) => Promise<void>;
  interruptCurrentVideo: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const AVATARS: Avatar[] = [
  { id: '1', name: 'Emma', description: 'Friendly and professional', previewUrl: '/avatars/1/preview.jpg' },
  { id: '2', name: 'James', description: 'Confident and direct', previewUrl: '/avatars/2/preview.jpg' },
  { id: '3', name: 'Sophia', description: 'Warm and empathetic', previewUrl: '/avatars/3/preview.jpg' },
  { id: '4', name: 'Lucas', description: 'Technical expert', previewUrl: '/avatars/4/preview.jpg' },
  { id: '5', name: 'Ava', description: 'Creative and dynamic', previewUrl: '/avatars/5/preview.jpg' },
  { id: '6', name: 'Noah', description: 'Analytical and precise', previewUrl: '/avatars/6/preview.jpg' }
];

const VideoContext = createContext<VideoContextValue | null>(null);

interface VideoProviderProps {
  children: React.ReactNode;
}

const preloadVideo = async (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = url;
    video.onloadeddata = () => resolve();
    video.onerror = reject;
    // Cleanup
    setTimeout(() => {
      video.src = '';
      video.remove();
    }, 0);
  });
};

export function VideoProvider({ children }: VideoProviderProps) {
  const [state, setState] = useState<VideoContextState>({
    currentAvatarId: null,
    videoState: 'idle',
    isLoading: false,
    isMuted: false,
    volume: 1
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();
  const cancelCallbackRef = useRef<() => void>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (cancelCallbackRef.current) {
        cancelCallbackRef.current();
      }
      if (videoRef.current) {
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, []);

  const preloadAvatarVideos = useCallback(async (avatarId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await Promise.all([
        preloadVideo(`/avatars/${avatarId}/greeting.mp4`),
        preloadVideo(`/avatars/${avatarId}/idle.mp4`)
      ]);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const setCurrentAvatar = useCallback(async (avatarId: string) => {
    await preloadAvatarVideos(avatarId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedAvatar', avatarId);
    }
    setState(prev => ({ ...prev, currentAvatarId: avatarId }));
  }, [preloadAvatarVideos]);

  const playGreeting = useCallback(async (avatarId: string) => {
    if (!videoRef.current) return;
    
    setState(prev => ({ ...prev, videoState: 'greeting' }));
    videoRef.current.src = `/avatars/${avatarId}/greeting.mp4`;
    await videoRef.current.play();

    // Auto switch to idle after greeting
    const onGreetingEnd = () => {
      if (videoRef.current) {
        switchToIdle();
      }
    };
    
    videoRef.current.addEventListener('ended', onGreetingEnd, { once: true });
    cancelCallbackRef.current = () => {
      videoRef.current?.removeEventListener('ended', onGreetingEnd);
    };
  }, []);

  const switchToIdle = useCallback(() => {
    if (!videoRef.current || !state.currentAvatarId) return;

    setState(prev => ({ ...prev, videoState: 'idle' }));
    videoRef.current.src = `/avatars/${state.currentAvatarId}/idle.mp4`;
    videoRef.current.loop = true;
    videoRef.current.play().catch(console.error);
  }, [state.currentAvatarId]);

  const playResponse = useCallback(async (responseUrl: string) => {
    if (!videoRef.current) return;

    setState(prev => ({ ...prev, videoState: 'response' }));
    videoRef.current.loop = false;
    videoRef.current.src = responseUrl;
    
    const onResponseEnd = () => {
      if (videoRef.current) {
        switchToIdle();
      }
    };

    videoRef.current.addEventListener('ended', onResponseEnd, { once: true });
    cancelCallbackRef.current = () => {
      videoRef.current?.removeEventListener('ended', onResponseEnd);
    };

    await videoRef.current.play();
  }, [switchToIdle]);

  const interruptCurrentVideo = useCallback(() => {
    if (!videoRef.current) return;

    if (cancelCallbackRef.current) {
      cancelCallbackRef.current();
      cancelCallbackRef.current = undefined;
    }

    videoRef.current.pause();
    switchToIdle();
  }, [switchToIdle]);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
    setState(prev => ({ ...prev, volume }));
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
    setState(prev => ({ ...prev, isMuted: muted }));
  }, []);

  const value = {
    ...state,
    setCurrentAvatar,
    playGreeting,
    switchToIdle,
    playResponse,
    interruptCurrentVideo,
    setVolume,
    setMuted,
    videoRef
  };

  return (
    <VideoContext.Provider value={value}>
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