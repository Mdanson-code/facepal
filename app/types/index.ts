export type VideoState = 'idle' | 'talking' | 'thinking' | 'transitioning';

export type ToastType = 'info' | 'warning' | 'error' | 'success';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface Avatar {
  id: string;
  name: string;
  description: string;
  languages: string[];
  previewUrl: string;
  videos: {
    idle: string;
    talking: string[];
    thinking?: string;
  };
}

export interface VideoContextState {
  currentAvatarId: string | null;
  videoState: VideoState;
  isLoading: boolean;
  error: string | null;
}

export interface VideoContextValue extends VideoContextState {
  videoRef: React.RefObject<HTMLVideoElement>;
  setCurrentAvatar: (avatarId: string) => Promise<void>;
  playGreeting: (avatarId: string) => Promise<void>;
  switchToIdle: () => void;
  playResponse: (responseUrl: string) => Promise<void>;
  interruptCurrentVideo: () => void;
  lastInterruptTime: number;
}

export interface AIResponse {
  text: string;
  videoUrl: string;
  language: string;
  confidence: number;
}

export interface UserInput {
  type: 'text' | 'voice' | 'image';
  content: string | Blob;
  timestamp: number;
  language?: string;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  alternativeLanguages: Array<{ code: string; confidence: number }>;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  isActive: boolean;
}