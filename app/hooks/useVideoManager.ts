import { useEffect, useRef, useState } from 'react';
import { videoManager, type VideoManagerState } from '../services/videoManager';

export function useVideoManager() {
  const [state, setState] = useState<VideoManagerState>(videoManager.getState());
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const unsubscribe = videoManager.onStateChange(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    videoManager.setVideoElement(videoRef.current);
    return () => videoManager.setVideoElement(null);
  }, []);

  return {
    ...state,
    videoRef,
    setCurrentAvatar: videoManager.setCurrentAvatar.bind(videoManager),
    playGreeting: videoManager.playGreeting.bind(videoManager),
    switchToIdle: videoManager.switchToIdle.bind(videoManager),
    playResponse: videoManager.playResponse.bind(videoManager),
    interruptCurrentVideo: videoManager.interruptCurrentVideo.bind(videoManager),
    setVolume: videoManager.setVolume.bind(videoManager),
    setMuted: videoManager.setMuted.bind(videoManager),
  };
}