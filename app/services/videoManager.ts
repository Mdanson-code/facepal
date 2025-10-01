import { useState, useCallback, useRef, useEffect } from 'react';
import { interactionService } from './interactionService';

export type VideoState = 'idle' | 'greeting' | 'response' | 'thinking' | 'talking';

export interface Avatar {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  languages: string[];
}

interface VideoCache {
  idle: string;
  thinking: string;
  talking: { [key: string]: { url: string; timestamp: number } };
}

interface VideoConfig {
  maxCacheSize: number;
  cacheExpiryMs: number;
  preloadRetries: number;
  generateTimeout: number;
  retryDelay: number;
}

const DEFAULT_CONFIG: VideoConfig = {
  maxCacheSize: 50,
  cacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  preloadRetries: 3,
  generateTimeout: 30000, // 30 seconds
  retryDelay: 1000, // 1 second
};

export interface VideoManagerState {
  currentAvatarId: string | null;
  videoState: VideoState;
  isLoading: boolean;
  isMuted: boolean;
  volume: number;
  interruptCount: number;
  lastInterruptTime: number;
}

export class VideoManager {
  private videoCache: { [avatarId: string]: VideoCache } = {};
  private state: VideoManagerState;
  private videoElement: HTMLVideoElement | null = null;
  private cancelCallback: (() => void) | null = null;
  private config: VideoConfig;
  private stateChangeCallbacks: Array<(state: VideoManagerState) => void> = [];
  private interruptController: AbortController | null = null;

  constructor(config: Partial<VideoConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      currentAvatarId: null,
      videoState: 'idle',
      isLoading: false,
      isMuted: false,
      volume: 1,
      interruptCount: 0,
      lastInterruptTime: 0,
    };
    this.startCacheCleanup();
  }

  private setState(newState: Partial<VideoManagerState>) {
    this.state = { ...this.state, ...newState };
    this.notifyStateChange();
  }

  private notifyStateChange() {
    this.stateChangeCallbacks.forEach(callback => callback(this.state));
  }

  onStateChange(callback: (state: VideoManagerState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  getState(): VideoManagerState {
    return { ...this.state };
  }

  setVideoElement(element: HTMLVideoElement | null) {
    this.videoElement = element;
    if (element) {
      element.volume = this.state.volume;
      element.muted = this.state.isMuted;
    }
  }

  private async preloadVideo(url: string): Promise<void> {
    let retries = this.config.preloadRetries;
    while (retries > 0) {
      try {
        const video = document.createElement('video');
        video.preload = 'auto';
        await new Promise((resolve, reject) => {
          video.onloadeddata = resolve;
          video.onerror = reject;
          video.src = url;
        });
        video.src = '';
        video.remove();
        return;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }
  }

  async preloadAvatarVideos(avatarId: string) {
    this.setState({ isLoading: true });
    try {
      await Promise.all([
        this.preloadVideo(`/avatars/${avatarId}/greeting.mp4`),
        this.preloadVideo(`/avatars/${avatarId}/idle.mp4`)
      ]);
    } catch (error) {
      console.error(`Failed to preload videos for avatar ${avatarId}:`, error);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private setupVideoEndedHandler(onEnded: () => void) {
    if (!this.videoElement) return;

    const handler = () => {
      if (this.videoElement) {
        onEnded();
      }
    };

    this.videoElement.addEventListener('ended', handler, { once: true });
    this.cancelCallback = () => {
      this.videoElement?.removeEventListener('ended', handler);
    };
  }

  async playGreeting(avatarId: string) {
    if (!this.videoElement) return;

    this.setState({ videoState: 'greeting' });
    this.videoElement.src = `/avatars/${avatarId}/greeting.mp4`;
    this.setupVideoEndedHandler(() => this.switchToIdle());
    await this.videoElement.play();
  }

  switchToIdle() {
    if (!this.videoElement || !this.state.currentAvatarId) return;

    this.setState({ videoState: 'idle' });
    this.videoElement.src = `/avatars/${this.state.currentAvatarId}/idle.mp4`;
    this.videoElement.loop = true;
    this.videoElement.play().catch(console.error);
  }

  async playResponse(responseUrl: string) {
    if (!this.videoElement) return;

    this.setState({ videoState: 'response' });
    this.videoElement.loop = false;
    this.videoElement.src = responseUrl;
    this.setupVideoEndedHandler(() => this.switchToIdle());
    await this.videoElement.play();
  }

  interruptCurrentVideo(isUserInterrupt: boolean = false) {
    if (!this.videoElement) return;

    if (this.cancelCallback) {
      this.cancelCallback();
      this.cancelCallback = null;
    }

    if (this.interruptController) {
      this.interruptController.abort();
      this.interruptController = null;
    }

    this.videoElement.pause();
    this.switchToIdle();
    
    // Only update interrupt state if it's a user-initiated interrupt
    if (isUserInterrupt) {
      interactionService.interrupt();
    }
  }

  setVolume(volume: number) {
    if (this.videoElement) {
      this.videoElement.volume = volume;
    }
    this.setState({ volume });
  }

  setMuted(muted: boolean) {
    if (this.videoElement) {
      this.videoElement.muted = muted;
    }
    this.setState({ isMuted: muted });
  }

  async setCurrentAvatar(avatarId: string) {
    await this.preloadAvatarVideos(avatarId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedAvatar', avatarId);
    }
    this.setState({ currentAvatarId: avatarId });
  }

  private startCacheCleanup() {
    setInterval(() => this.cleanCache(), this.config.cacheExpiryMs);
  }

  protected cleanCache() {
    const now = Date.now();
    Object.entries(this.videoCache).forEach(([avatarId, cache]) => {
      const talkingVideos = (cache as VideoCache).talking;
      Object.entries(talkingVideos).forEach(([text, entry]) => {
        if (now - entry.timestamp > this.config.cacheExpiryMs) {
          delete talkingVideos[text];
        }
      });
    });
  }

  dispose() {
    if (this.cancelCallback) {
      this.cancelCallback();
      this.cancelCallback = null;
    }
    if (this.videoElement) {
      this.videoElement.src = '';
      this.videoElement.load();
    }
    this.stateChangeCallbacks = [];
  }
}

export const videoManager = new VideoManager();