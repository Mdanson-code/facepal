import { interactionService } from './interactionService';

interface AIResponse {
  text: string;
  language: string;
  confidence: number;
}

class AIService {
  private async callAI(text: string, language: string): Promise<AIResponse> {
    try {
      const result = await interactionService.processInput(text, 'text', language);
      
      return {
        text: result.text,
        language: result.language,
        confidence: 0.95
      };
    } catch (error) {
      console.error('Error calling AI service:', error);
      throw error;
    }
  }

  async processInput(input: string, language: string): Promise<AIResponse> {
    try {
      return await this.callAI(input, language);
    } catch (error) {
      console.error('Error processing input:', error);
      throw error;
    }
  }

  async processVoiceInput(audioBlob: Blob): Promise<{ text: string; language: string }> {
    try {
      const result = await interactionService.processInput(audioBlob, 'voice');
      return {
        text: result.text,
        language: result.language
      };
    } catch (error) {
      console.error('Error processing voice input:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();