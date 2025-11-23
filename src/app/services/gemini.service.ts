import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal, computed } from '@angular/core';
import { environment } from '../../environments/environment';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GeminiRequest {
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    index: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private readonly apiKey = environment.geminiApiKey;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  // Signals for state management
  private messagesSignal = signal<Message[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Computed signals
  public messages = computed(() => this.messagesSignal());
  public isLoading = computed(() => this.loadingSignal());
  public error = computed(() => this.errorSignal());
  public hasMessages = computed(() => this.messagesSignal().length > 0);

  constructor(private http: HttpClient) {}

  async sendMessage(userMessage: string): Promise<void> {
    if (!userMessage.trim()) {
      this.errorSignal.set('Message cannot be empty');
      return;
    }

    if (!this.apiKey) {
      this.errorSignal.set(
        'Gemini API key not configured. Please set GEMINI_API_KEY in environment.ts'
      );
      return;
    }

    try {
      // Add user message to chat
      const userMsg: Message = {
        id: this.generateId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };
      this.messagesSignal.update(msgs => [...msgs, userMsg]);
      this.errorSignal.set(null);

      // Set loading state
      this.loadingSignal.set(true);

      // Build request with conversation history
      const request: GeminiRequest = {
        contents: this.messagesSignal().map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      };

      // Call Gemini API
      const response = await this.http
        .post<GeminiResponse>(`${this.apiUrl}?key=${this.apiKey}`, request)
        .toPromise();

      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const assistantMessage: Message = {
          id: this.generateId(),
          role: 'assistant',
          content: response.candidates[0].content.parts[0].text,
          timestamp: new Date()
        };
        this.messagesSignal.update(msgs => [...msgs, assistantMessage]);
      } else {
        this.errorSignal.set('Invalid response from Gemini API');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get response from Gemini API';
      this.errorSignal.set(errorMessage);
      console.error('Gemini API Error:', error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  clearMessages(): void {
    this.messagesSignal.set([]);
    this.errorSignal.set(null);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
