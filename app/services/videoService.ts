// Video state and processing service
interface VideoCache {
  idle: string;
  thinking: string;
  talking: { [key: string]: { url: string; timestamp: number } };
}

interface VideoConfig {
  maxCacheSize: number;        // Maximum number of videos to cache per avatar
  cacheExpiryMs: number;      // Time in ms after which cache entries expire
  preloadRetries: number;     // Number of times to retry preloading
  generateTimeout: number;    // Timeout for video generation in ms
  retryDelay: number;        // Delay between retries in ms
}

const DEFAULT_CONFIG: VideoConfig = {
  maxCacheSize: 50,
  cacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  preloadRetries: 3,
  generateTimeout: 30000, // 30 seconds
  retryDelay: 1000 // 1 second
};rocessing service
interface VideoCache {
  idle: string;
  thinking: string;
  talking: { [key: string]: { url: string; timestamp: number } };  // Cache talking videos with timestamp
}

interface VideoConfig {
  maxCacheSize: number;        // Maximum number of videos to cache per avatar
  cacheExpiryMs: number;      // Time in ms after which cache entries expire
  preloadRetries: number;     // Number of times to retry preloading
  generateTimeout: number;    // Timeout for video generation in ms
}

const DEFAULT_CONFIG: VideoConfig = {
  maxCacheSize: 50,
  cacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  preloadRetries: 3,
  generateTimeout: 30000 // 30 seconds
};

type VideoState = 'idle' | 'thinking' | 'talking';

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

interface VideoProcessingQueue {
  avatarId: string;
  text: string;
  language: string;
  responseId: string;
  resolve: (url: string) => void;
  reject: (error: Error) => void;
}

class VideoService {
  private videoCache: { [avatarId: string]: VideoCache } = {};
  private videoStates: { [avatarId: string]: VideoState } = {};
  private stateCallbacks: VideoStateCallback[] = [];
  private currentTransition: VideoTransition | null = null;
  private processingQueue: Promise<unknown> = Promise.resolve();
  private currentAvatarId: string | null = null;
  private interruptController: AbortController | null = null;
  private config: VideoConfig;

  constructor(config: Partial<VideoConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.preloadIdleVideos().catch(error => {
      console.error('Failed to preload idle videos:', error);
    });
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

  constructor() {
    this.preloadIdleVideos();
  }

  async preloadIdleVideos() {
    const avatarIds = ['1', '2', '3', '4', '5', '6'];
    for (const id of avatarIds) {
      const idleVideo = `/avatars/${id}-idle.mp4`;
      const thinkingVideo = `/avatars/${id}-thinking.mp4`;
      
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
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
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
    this.interruptController = new AbortController();
    const signal = this.interruptController.signal;

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
    // Check cache first
    if (this.videoCache[avatarId]?.talking[text]) {
      return this.videoCache[avatarId].talking[text];
    }

    // Queue the video generation to prevent multiple simultaneous generations
    this.processingQueue = this.processingQueue.then(async () => {
      try {
        // 1. Generate TTS audio if needed
        const audioUrl = await this.generateTTS(text, language);

        // 2. Generate lip-synced video using Wav2Lip or similar
            // 1. Generate TTS audio
            const audioUrl = await this.generateTTS(text, language);
            if (signal.aborted) throw new Error('Aborted');

            // 2. Generate lip-synced video
            const talkingVideoUrl = await this.lipSync(avatarId, audioUrl, text);
            if (signal.aborted) throw new Error('Aborted');

            // 3. Cache the result
            if (!this.videoCache[avatarId]) {
              this.videoCache[avatarId] = {
                idle: `/avatars/${avatarId}-idle.mp4`,
                thinking: `/avatars/${avatarId}-thinking.mp4`,
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
            if ((error as Error).message === 'Aborted') {
              reject(new Error('Video generation interrupted'));
            } else {
              console.error('Error generating talking video:', error);
              // Fallback to a generic talking video
              resolve(`/avatars/${avatarId}-talking.mp4`);
            }
          }
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });    return this.processingQueue;
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
    
    // For demo, return a dummy video URL
    return `/avatars/${avatarId}-talking-${Date.now()}.mp4`;
  }

  async switchToTalking(avatarId: string, text: string, language: string, responseId: string): Promise<string> {
    this.currentAvatarId = avatarId;
    
    // If there's a current video playing, interrupt it
    if (this.interruptController) {
      this.interruptController.abort();
      this.interruptController = null;
    }

    // Update state to thinking while generating
    this.updateState(avatarId, 'thinking', { responseId });
    
    try {
      const videoUrl = await this.generateTalkingVideo(avatarId, text, language, responseId);
      this.updateState(avatarId, 'talking', { responseId });
      return videoUrl;
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        // Request was interrupted, revert to idle
        this.updateState(avatarId, 'idle');
        throw new Error('Video generation interrupted');
      }
      throw error;
    }
  }

  interrupt(): void {
    if (this.interruptController) {
      this.interruptController.abort();
      this.interruptController = null;
    }
    
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
    return this.videoCache[avatarId]?.thinking || `/avatars/${avatarId}-thinking.mp4`;
  }

  getIdleVideo(avatarId: string): string {
    return this.videoCache[avatarId]?.idle || `/avatars/${avatarId}-idle.mp4`;
  }

  isVideoReady(avatarId: string, text: string): boolean {
    return !!this.videoCache[avatarId]?.talking[text];
  }
}

export const videoService = new VideoService();