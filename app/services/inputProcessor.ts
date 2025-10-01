interface ProcessingResult {
  text: string;
  language: string;
  interrupted?: boolean;
  notice?: string;
}

interface InputProcessor {
  processText(text: string, language?: string): Promise<ProcessingResult>;
  processVoice(audio: Blob): Promise<ProcessingResult>;
  processImage(image: File): Promise<ProcessingResult>;
}

interface ProcessingState {
  isProcessing: boolean;
  currentLanguage: string;
  lastProcessedAt: number;
  interruptCount: number;
  lastInterruptAt?: number;
}

type InputType = 'text' | 'voice' | 'image';

class AIInputProcessor implements InputProcessor {
  private currentController: AbortController | null = null;
  private processingQueue: Promise<any> = Promise.resolve();
  private readonly INTERRUPT_THRESHOLD = 3; // Number of interrupts before notice
  private readonly INTERRUPT_RESET_TIME = 30000; // Reset interrupt count after 30s

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

  private getLanguageResponses(language: string): string[] {
    const responses = {
      en: [
        "I understand completely. How can I help you further?",
        "That's an interesting point. Could you elaborate?",
        "I see what you mean. Let me help you with that."
      ],
      es: [
        "Entiendo completamente. ¿Cómo puedo ayudarte más?",
        "Es un punto interesante. ¿Podrías elaborar más?",
        "Entiendo lo que quieres decir. Déjame ayudarte con eso."
      ],
      sw: [
        "Naelewa kabisa. Nawezaje kukusaidia zaidi?",
        "Hiyo ni pointi nzuri. Unaweza kuelezea zaidi?",
        "Naona unamaanisha nini. Hebu nikusaidie na hilo."
      ]
    };
    
    return responses[language as keyof typeof responses] || responses.en;
  }
  private state: ProcessingState = {
    isProcessing: false,
    currentLanguage: 'en',
    lastProcessedAt: 0,
    interruptCount: 0
  };

  private interrupt(): void {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
      
      // Track interruption
      const now = Date.now();
      if (this.state.lastInterruptAt && now - this.state.lastInterruptAt > this.INTERRUPT_RESET_TIME) {
        this.state.interruptCount = 0;
      }
      this.state.interruptCount++;
      this.state.lastInterruptAt = now;
    }
  }

  private async detectLanguage(input: string): Promise<string> {
    try {
      // Replace with actual language detection service
      // For now, return the current language
      return this.state.currentLanguage;
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'en'; // Default to English
    }
  }

  public async processText(text: string, language?: string): Promise<ProcessingResult> {
    this.interrupt();

    this.currentController = new AbortController();
    const signal = this.currentController.signal;
    this.state.isProcessing = true;
    
    try {
      // Use provided language or detect it
      const detectedLanguage = language || await this.detectLanguage(text);
      this.state.currentLanguage = detectedLanguage;
      
      // Check for interruption notice
      let notice: string | undefined;
      if (this.state.interruptCount >= this.INTERRUPT_THRESHOLD) {
        notice = this.getInterruptionNotice(detectedLanguage);
      }

      // Simulate AI response with interrupt check
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (signal.aborted) throw new Error('Interrupted');

      const responses = this.getLanguageResponses(detectedLanguage);
      const response = responses[Math.floor(Math.random() * responses.length)];

      return {
        text: notice ? `${notice} ${response}` : response,
        language: detectedLanguage,
        interrupted: false
      };

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
      this.state.isProcessing = false;
      this.state.lastProcessedAt = Date.now();
    }
    this.state.isProcessing = true;
    this.state.currentLanguage = language;
    this.state.lastProcessedAt = Date.now();

    try {
      // Use language-specific processing if needed
      const detectedLanguage = language || await this.detectLanguage(text);
      
      // Simulate AI processing with language-specific responses
      const responses = {
        en: [
          "I understand. How can I help you with that?",
          "That's interesting! Tell me more.",
          "I see what you mean."
        ],
        es: [
          "Entiendo. ¿Cómo puedo ayudarte con eso?",
          "¡Qué interesante! Cuéntame más.",
          "Ya veo lo que quieres decir."
        ],
        sw: [
          "Naelewa. Nawezaje kukusaidia?",
          "Ina mvuto! Niambie zaidi.",
          "Naona unachomaanisha."
        ]
      };

      // Get responses for the detected language, fallback to English
      const availableResponses = responses[detectedLanguage as keyof typeof responses] || responses.en;
      const response = availableResponses[Math.floor(Math.random() * availableResponses.length)];

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return response;
    } finally {
      this.state.isProcessing = false;
    }
  }

  public async processVoice(audio: Blob): Promise<ProcessingResult> {
    this.interrupt();
    
    this.currentController = new AbortController();
    const signal = this.currentController.signal;
    this.state.isProcessing = true;

    try {
      // Simulate voice processing with different languages
      const samples = [
        { text: "Hello, can you help me with something?", language: "en" },
        { text: "Hola, ¿puedes ayudarme con algo?", language: "es" },
        { text: "Hujambo, unaweza kunisaidia?", language: "sw" }
      ];

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (signal.aborted) throw new Error('Interrupted');

      const result = samples[Math.floor(Math.random() * samples.length)];
      this.state.currentLanguage = result.language;

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
      this.state.isProcessing = false;
      this.state.lastProcessedAt = Date.now();
    }
    this.state.isProcessing = true;
    this.state.lastProcessedAt = Date.now();

    try {
      // Simulate voice processing with different languages
      const samples = [
        { text: "Hello, can you help me with something?", language: "en" },
        { text: "Hola, ¿puedes ayudarme con algo?", language: "es" },
        { text: "Hujambo, unaweza kunisaidia?", language: "sw" }
      ];

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = samples[Math.floor(Math.random() * samples.length)];
      this.state.currentLanguage = result.language;
      return result;
    } finally {
      this.state.isProcessing = false;
    }
  }

  public async processImage(image: File): Promise<ProcessingResult> {
    this.interrupt();
    
    this.currentController = new AbortController();
    const signal = this.currentController.signal;
    this.state.isProcessing = true;

    try {
      // Simulate image processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (signal.aborted) throw new Error('Interrupted');

      // Generate description in current language
      const descriptions = {
        en: `I see an image named "${image.name}". Let me describe what I see...`,
        es: `Veo una imagen llamada "${image.name}". Déjame describir lo que veo...`,
        sw: `Naona picha inayoitwa "${image.name}". Acha nikueleze ninachokiona...`
      };

      const description = descriptions[this.state.currentLanguage as keyof typeof descriptions] || descriptions.en;
      
      let notice: string | undefined;
      if (this.state.interruptCount >= this.INTERRUPT_THRESHOLD) {
        notice = this.getInterruptionNotice(this.state.currentLanguage);
      }

      return {
        text: notice ? `${notice} ${description}` : description,
        language: this.state.currentLanguage,
        interrupted: false,
        notice
      };
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
      this.state.isProcessing = false;
      this.state.lastProcessedAt = Date.now();
    }
    this.state.isProcessing = true;
    this.state.lastProcessedAt = Date.now();

    try {
      // Simulate image processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Return a description in the current language
      const descriptions = {
        en: `I see an image named "${image.name}". Let me describe what I see...`,
        es: `Veo una imagen llamada "${image.name}". Déjame describir lo que veo...`,
        sw: `Naona picha inayoitwa "${image.name}". Acha nikueleze ninachokiona...`
      };

      return descriptions[this.state.currentLanguage as keyof typeof descriptions] || descriptions.en;
    } finally {
      this.state.isProcessing = false;
    }
  }

  public isProcessing(): boolean {
    return this.state.isProcessing;
  }

  public getCurrentLanguage(): string {
    return this.state.currentLanguage;
  }

  public resetInterruptCount(): void {
    this.state.interruptCount = 0;
    this.state.lastInterruptAt = undefined;
  }

  public getProcessingState(): ProcessingState {
    return { ...this.state };
  }
}

export const aiInputProcessor = new AIInputProcessor();