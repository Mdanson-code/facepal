interface AIResponse {
  text: string;
  language: string;
  confidence: number;
}

import { aiInputProcessor } from './inputProcessor';

class AIService {
  private async callAI(text: string, language: string): Promise<AIResponse> {
    try {
      // Process input using the input processor
      const response = await aiInputProcessor.processText(text, language);
      
      return {
        text: response,
        language: language,
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
      return await aiInputProcessor.processVoice(audioBlob);
    } catch (error) {
      console.error('Error processing voice input:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();