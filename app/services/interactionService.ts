interface SupportedLanguage {
  code: string;
  name: string;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Swahili' },
  { code: 'es', name: 'Spanish' }
];

interface InteractionState {
  currentLanguage: string;
  isProcessing: boolean;
  interruptCount: number;
  lastInterruptTime: number;
  lastProcessedAt: number;
  currentResponseId: string | null;
  isProcessingVoice: boolean;
  transcribedText: string | null;
  inputQueue: Array<{
    id: string;
    type: 'text' | 'voice' | 'image';
    content: string | Blob;
    timestamp: number;
  }>;
}

export interface ProcessingResult {
  text: string;
  language: string;
  interrupted?: boolean;
  notice?: string;
}

type StateChangeCallback = (state: InteractionState) => void;

import { BaseStateService, WithInterruption, withInterruption } from '../utils/baseService';

import { StateService } from '../hooks/useServiceState';

export class InteractionServiceBase extends BaseStateService<InteractionState> implements StateService<InteractionState> {
  private readonly INTERRUPT_THRESHOLD = 3;
  private readonly INTERRUPT_RESET_TIME = 30000; // 30 seconds
  private readonly INTERRUPT_WINDOW = 60000; // 1 minute
  private currentController: AbortController | null = null;

  constructor() {
    super({
      currentLanguage: 'en',
      isProcessing: false,
      interruptCount: 0,
      lastInterruptTime: 0,
      lastProcessedAt: 0,
      currentResponseId: null,
      isProcessingVoice: false,
      transcribedText: null,
      inputQueue: []
    });
  }
}

export class InteractionService extends withInterruption(InteractionServiceBase) {

  private getInterruptionNotice(language: string): string {
    const notices = {
      en: [
        "I notice you're eager to share! Let me finish my thought first. ",
        "One moment please, I'm still processing the previous input. ",
        "I appreciate your enthusiasm! Let's take it one step at a time. "
      ],
      es: [
        "¡Veo que tienes muchas cosas que compartir! Déjame terminar primero. ",
        "Un momento por favor, aún estoy procesando la entrada anterior. ",
        "¡Aprecio tu entusiasmo! Vayamos paso a paso. "
      ],
      sw: [
        "Naona una hamu ya kushiriki! Niache nimalize kwanza. ",
        "Tafadhali ngoja, bado nashughulikia mchango uliopita. ",
        "Napenda shauku yako! Tuende hatua kwa hatua. "
      ]
    };
    
    const availableNotices = notices[language as keyof typeof notices] || notices.en;
    return availableNotices[Math.floor(Math.random() * availableNotices.length)];
  }

  interrupt() {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }

    const now = Date.now();
    if (now - this.state.lastInterruptTime > this.INTERRUPT_WINDOW) {
      this.setState({ 
        interruptCount: 1, 
        lastInterruptTime: now 
      });
    } else {
      this.setState({
        interruptCount: this.state.interruptCount + 1,
        lastInterruptTime: now
      });
    }
  }

  async processInput(
    input: string | Blob | File, 
    type: 'text' | 'voice' | 'image', 
    language?: string
  ): Promise<ProcessingResult> {
    this.interrupt(); // Cancel any ongoing processing
    
    this.currentController = new AbortController();
    const signal = this.currentController.signal;
    
    this.setState({ 
      isProcessing: true,
      lastProcessedAt: Date.now(),
      currentLanguage: language || this.state.currentLanguage
    });

    try {
      // Add to queue
      const inputId = Date.now().toString();
      this.state.inputQueue.push({
        id: inputId,
        type,
        content: input,
        timestamp: Date.now()
      });

      // Process based on type
      if (type === 'text') {
        return this.processText(input as string, language, signal);
      } else if (type === 'voice') {
        return this.processVoice(input as Blob, signal);
      } else {
        return this.processImage(input as File, signal);
      }
    } catch (error) {
      if ((error as Error).message === 'Interrupted') {
        return {
          text: '',
          language: this.state.currentLanguage,
          interrupted: true
        };
      }
      throw error;
    } finally {
      this.setState({ isProcessing: false });
    }
  }

  private async processText(
    text: string, 
    language: string | undefined,
    signal: AbortSignal
  ): Promise<ProcessingResult> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (signal.aborted) throw new Error('Interrupted');

    const detectedLanguage = language || this.state.currentLanguage;
    let notice: string | undefined;

    if (this.state.interruptCount >= this.INTERRUPT_THRESHOLD) {
      notice = this.getInterruptionNotice(detectedLanguage);
    }

    // Simulated response
    const responses = {
      en: ["I understand. How can I help?", "Interesting, tell me more."],
      es: ["Entiendo. ¿Cómo puedo ayudar?", "Interesante, cuéntame más."],
      sw: ["Naelewa. Nawezaje kusaidia?", "Inavutia, niambie zaidi."]
    };

    const availableResponses = responses[detectedLanguage as keyof typeof responses] || responses.en;
    const response = availableResponses[Math.floor(Math.random() * availableResponses.length)];

    return {
      text: notice ? `${notice} ${response}` : response,
      language: detectedLanguage,
      interrupted: false,
      notice
    };
  }

  private async processVoice(blob: Blob, signal: AbortSignal): Promise<ProcessingResult> {
    // Simulate voice processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (signal.aborted) throw new Error('Interrupted');

    const samples = [
      { text: "Hello, how can I help?", language: "en" },
      { text: "Hola, ¿cómo puedo ayudar?", language: "es" },
      { text: "Hujambo, nawezaje kusaidia?", language: "sw" }
    ];

    const result = samples[Math.floor(Math.random() * samples.length)];
    let notice: string | undefined;

    if (this.state.interruptCount >= this.INTERRUPT_THRESHOLD) {
      notice = this.getInterruptionNotice(result.language);
    }

    return {
      text: notice ? `${notice} ${result.text}` : result.text,
      language: result.language,
      interrupted: false,
      notice
    };
  }

  private async processImage(file: File, signal: AbortSignal): Promise<ProcessingResult> {
    // Simulate image processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (signal.aborted) throw new Error('Interrupted');

    const descriptions = {
      en: `I see an image named "${file.name}". Let me describe what I see...`,
      es: `Veo una imagen llamada "${file.name}". Déjame describir lo que veo...`,
      sw: `Naona picha inayoitwa "${file.name}". Acha nikueleze ninachokiona...`
    };

    let notice: string | undefined;
    if (this.state.interruptCount >= this.INTERRUPT_THRESHOLD) {
      notice = this.getInterruptionNotice(this.state.currentLanguage);
    }

    const description = descriptions[this.state.currentLanguage as keyof typeof descriptions] || descriptions.en;

    return {
      text: notice ? `${notice} ${description}` : description,
      language: this.state.currentLanguage,
      interrupted: false,
      notice
    };
  }

  getState(): InteractionState {
    return { ...this.state };
  }

  clearQueue() {
    this.setState({ inputQueue: [] });
  }

  reset() {
    this.setState({
      currentLanguage: 'en',
      isProcessing: false,
      interruptCount: 0,
      lastInterruptTime: 0,
      lastProcessedAt: 0,
      currentResponseId: null,
      isProcessingVoice: false,
      transcribedText: null,
      inputQueue: []
    });
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return [...SUPPORTED_LANGUAGES];
  }

  setLanguage(language: string) {
    if (SUPPORTED_LANGUAGES.some(l => l.code === language)) {
      this.setState({ currentLanguage: language });
    }
  }

  async translateText(text: string, targetLang: string): Promise<string> {
    try {
      // Example URL pattern - replace with your actual translation service URL
      const translationUrl = `https://translate.facepal.ai/${targetLang}?text=${encodeURIComponent(text)}`;
      
      // For demo purposes, simulate translation with language prefix
      const translations: { [key: string]: string } = {
        en: text,
        es: `[ES] ${text}`,
        sw: `[SW] ${text}`
      };
      
      return translations[targetLang] || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  setTranscribedText(text: string | null) {
    this.setState({ transcribedText: text });
  }

  setIsProcessingVoice(isProcessing: boolean) {
    this.setState({ isProcessingVoice: isProcessing });
  }
}

export const interactionService = new InteractionService();