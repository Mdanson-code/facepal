import { interactionService } from './interactionService';

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
  cacheExpiryMs: 24 * 60 * 60 * 1000,
  preloadRetries: 3,
  generateTimeout: 30000,
  retryDelay: 1000
};

type VideoState = 'idle' | 'thinking' | 'talking' | 'greeting' | 'response';

interface VideoStateCallback {
  (avatarId: string, state: VideoState, meta?: { responseId?: string }): void;
}

interface VideoTransition {
  fromState: VideoState;
  toState: VideoState;
  avatarId: string;
  responseId?: string;
  interrupted?: boolean;
}

class VideoService {
  private videoCache: { [avatarId: string]: VideoCache } = {};
  private videoStates: { [avatarId: string]: VideoState } = {};
  private stateCallbacks: VideoStateCallback[] = [];
  private currentTransition: VideoTransition | null = null;
  private processingQueue: Promise<unknown> = Promise.resolve();
  private currentAvatarId: string | null = null;
  private config: VideoConfig;

  constructor(config: Partial<VideoConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCacheCleanup();
  }

  private startCacheCleanup(): void {
    setInterval(() => this.cleanCache(), this.config.cacheExpiryMs);
  }

  private cleanCache(): void {
    const now = Date.now();
    Object.keys(this.videoCache).forEach(avatarId => {
      const cache = this.videoCache[avatarId].talking;
      const entries = Object.entries(cache);
      
      // Remove expired entries
      entries.forEach(([text, { timestamp }]) => {
        if (now - timestamp > this.config.cacheExpiryMs) {
          delete cache[text];
        }
      });

      // Remove oldest entries if cache is too large
      if (Object.keys(cache).length > this.config.maxCacheSize) {
        const sortedEntries = entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
        const toRemove = sortedEntries.slice(0, sortedEntries.length - this.config.maxCacheSize);
        toRemove.forEach(([text]) => delete cache[text]);
      }
    });
  }

  async preloadIdleVideos() {
    const avatarIds = ['sarah', 'michael', 'james', 'emily', 'lisa', 'david'];
    for (const id of avatarIds) {
      const idleVideo = `/avatars/${id}/idle.mp4`;
      const thinkingVideo = `/avatars/${id}/greeting.mp4`;
      
      // Try to preload with retries
      let loaded = false;
      for (let attempt = 0; attempt < this.config.preloadRetries && !loaded; attempt++) {
        try {
          await Promise.all([
            this.preloadVideo(idleVideo),
            this.preloadVideo(thinkingVideo)
          ]);
          loaded = true;
        } catch (error) {
          console.error(`Failed to preload videos for avatar ${id}, attempt ${attempt + 1}:`, error);
          if (attempt === this.config.preloadRetries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
        }
      }

      this.videoCache[id] = {
        idle: idleVideo,
        thinking: thinkingVideo,
        talking: {}
      };
      
      // Set initial state to idle
      this.videoStates[id] = 'idle';
    }
  }

  private preloadVideo(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = url;
      video.onloadeddata = () => resolve();
      video.onerror = reject;
    });
  }

  async generateTalkingVideo(avatarId: string, text: string, language: string, responseId: string): Promise<string> {
    // Check for interruptions
    const interactionState = interactionService.getState();
    if (interactionState.interruptCount > 0) {
      throw new Error('Video generation interrupted');
    }

    // Check cache first
    const cached = this.videoCache[avatarId]?.talking[text];
    if (cached && Date.now() - cached.timestamp <= this.config.cacheExpiryMs) {
      return cached.url;
    }

    // Add to processing queue
    return new Promise((resolve, reject) => {
      this.processingQueue = this.processingQueue.then(async () => {
        try {
          // Set timeout for video generation
          const timeoutId = setTimeout(() => {
            reject(new Error('Video generation timed out'));
          }, this.config.generateTimeout);

          try {
            // 1. Generate TTS audio
            const audioUrl = await this.generateTTS(text, language);
            
            // Check for interruption
            const currentState = interactionService.getState();
            if (currentState.interruptCount > 0) {
              throw new Error('Video generation interrupted');
            }

            // 2. Generate lip-synced video
            const talkingVideoUrl = await this.lipSync(avatarId, audioUrl, text);
            
            // Check for interruption again
            const finalState = interactionService.getState();
            if (finalState.interruptCount > 0) {
              throw new Error('Video generation interrupted');
            }

            // 3. Cache the result
            if (!this.videoCache[avatarId]) {
              this.videoCache[avatarId] = {
                idle: `/avatars/${avatarId}/idle.mp4`,
                thinking: `/avatars/${avatarId}/greeting.mp4`,
                talking: {}
              };
            }

            this.videoCache[avatarId].talking[text] = {
              url: talkingVideoUrl,
              timestamp: Date.now()
            };

            clearTimeout(timeoutId);
            resolve(talkingVideoUrl);
          } catch (error) {
            clearTimeout(timeoutId);
            if ((error as Error).message === 'Video generation interrupted') {
              reject(new Error('Video generation interrupted'));
            } else {
              console.error('Error generating talking video:', error);
              // Fallback to greeting clip to avoid blocking the UI
              resolve(`/avatars/${avatarId}/greeting.mp4`);
            }
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async generateTTS(text: string, language: string): Promise<string> {
    // Example URL pattern - replace with your actual TTS service
    const ttsUrl = `https://tts.facepal.ai/synthesize`;
    
    // For demo, return a dummy audio URL
    return `/audio/response-${language}.wav`;
  }

  private async lipSync(avatarId: string, audioUrl: string, text: string): Promise<string> {
    // Example URL pattern - replace with your actual lip sync service
    const lipSyncUrl = `https://lipsync.facepal.ai/generate`;

    // For demo, reuse greeting clip to avoid 404s and heavy generation
    return `/avatars/${avatarId}/greeting.mp4`;
  }

  async switchToTalking(avatarId: string, text: string, language: string, responseId: string): Promise<string> {
    this.currentAvatarId = avatarId;

    // Update state to thinking while generating
    this.updateState(avatarId, 'thinking', { responseId });
    
    try {
      const videoUrl = await this.generateTalkingVideo(avatarId, text, language, responseId);
      this.updateState(avatarId, 'talking', { responseId });
      return videoUrl;
    } catch (error) {
      // Request was interrupted, revert to idle
      this.updateState(avatarId, 'idle');
      throw error;
    }
  }

  interrupt(): void {
    interactionService.interrupt();
    if (this.currentAvatarId) {
      this.updateState(this.currentAvatarId, 'idle');
    }
  }

  private updateState(avatarId: string, state: VideoState, meta?: { responseId?: string }): void {
    this.videoStates[avatarId] = state;
    this.stateCallbacks.forEach(callback => callback(avatarId, state, meta));
  }

  onStateChange(callback: VideoStateCallback): () => void {
    this.stateCallbacks.push(callback);
    return () => {
      this.stateCallbacks = this.stateCallbacks.filter(cb => cb !== callback);
    };
  }

  onVideoComplete(avatarId: string): void {
    if (this.videoStates[avatarId] === 'talking') {
      this.updateState(avatarId, 'idle');
    }
  }

  getVideoState(avatarId: string): VideoState {
    return this.videoStates[avatarId] || 'idle';
  }

  getThinkingVideo(avatarId: string): string {
    return this.videoCache[avatarId]?.thinking || `/avatars/${avatarId}/greeting.mp4`;
  }

  getIdleVideo(avatarId: string): string {
    return this.videoCache[avatarId]?.idle || `/avatars/${avatarId}/idle.mp4`;
  }

  isVideoReady(avatarId: string, text: string): boolean {
    return !!this.videoCache[avatarId]?.talking[text];
  }
}

export const videoService = new VideoService();