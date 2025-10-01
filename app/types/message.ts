export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  language: string;
}
