export type VideoState = 'idle' | 'greeting' | 'responding' | 'error';

export type SupportedLanguage = {
  code: string;
  name: string;
};

export type Avatar = {
  id: string;
  name: string;
  description?: string;
  previewUrl: string;
  videoUrls: {
    greeting: string;
    idle: string;
    responses: string[];
  };
  loadState?: 'loading' | 'loaded' | 'error';
  languages: string[];
};

export type VideoContextType = {
  currentAvatarId: string | null;
  videoState: VideoState;
  isLoading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  setCurrentAvatar: (avatarId: string) => Promise<void>;
  playGreeting: (avatarId: string) => Promise<void>;
  playResponse: (avatarId: string, responseIndex: number) => Promise<void>;
  resetToIdle: () => void;
};

export type AIResponse = {
  text: string;
  videoUrl: string;
  language: string;
};

export type InteractionState = {
  isListening: boolean;
  isProcessing: boolean;
  lastInteraction: number;
  interruptCount: number;
};

export type ToastType = 'warning' | 'error' | 'info' | 'success';

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};