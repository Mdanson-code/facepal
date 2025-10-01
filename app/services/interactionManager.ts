interface InteractionState {
  interruptions: number;
  lastInterruptionTime: number;
  isResponding: boolean;
  currentResponseId: string | null;
  inputQueue: Array<{
    id: string;
    type: 'text' | 'voice' | 'image';
    content: string | Blob;
    timestamp: number;
  }>;
}

class InteractionManager {
  private state: InteractionState = {
    interruptions: 0,
    lastInterruptionTime: 0,
    isResponding: false,
    currentResponseId: null,
    inputQueue: []
  };

  private readonly INTERRUPTION_WINDOW = 60000; // 1 minute
  private readonly MAX_INTERRUPTIONS = 3;

  checkInterruption(): { shouldWarn: boolean; message?: string } {
    const now = Date.now();
    
    // Reset interruption count if window has passed
    if (now - this.state.lastInterruptionTime > this.INTERRUPTION_WINDOW) {
      this.state.interruptions = 0;
    }

    if (!this.state.isResponding) {
      return { shouldWarn: false };
    }

    this.state.interruptions++;
    this.state.lastInterruptionTime = now;

    if (this.state.interruptions >= this.MAX_INTERRUPTIONS) {
      const messages = [
        "Please let me finish my response so we can communicate better 😊",
        "Hey, slow down! Even I need to finish my thoughts 😏",
        "I know you're excited, but let's take turns speaking! 😅",
        "Whoa there! One thought at a time, please! 🎯"
      ];
      
      return {
        shouldWarn: true,
        message: messages[Math.min(this.state.interruptions - this.MAX_INTERRUPTIONS, messages.length - 1)]
      };
    }

    return { shouldWarn: false };
  }

  startResponse(responseId: string) {
    this.state.isResponding = true;
    this.state.currentResponseId = responseId;
  }

  endResponse() {
    this.state.isResponding = false;
    this.state.currentResponseId = null;
  }

  queueInput(input: { type: 'text' | 'voice' | 'image'; content: string | Blob }) {
    const inputId = Date.now().toString();
    this.state.inputQueue.push({
      id: inputId,
      ...input,
      timestamp: Date.now()
    });
    return inputId;
  }

  getNextInput() {
    return this.state.inputQueue.shift();
  }

  hasQueuedInputs(): boolean {
    return this.state.inputQueue.length > 0;
  }

  clearQueue() {
    this.state.inputQueue = [];
  }

  reset() {
    this.state.interruptions = 0;
    this.state.lastInterruptionTime = 0;
    this.state.isResponding = false;
    this.state.currentResponseId = null;
    this.clearQueue();
  }
}

export const interactionManager = new InteractionManager();