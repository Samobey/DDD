import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-gemini-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gemini-demo.component.html',
  styleUrl: './gemini-demo.component.scss'
})
export class GeminiDemoComponent implements OnInit {
  userInput = '';
  protected geminiService = inject(GeminiService);

  get messages() {
    return this.geminiService.messages();
  }

  get isLoading() {
    return this.geminiService.isLoading();
  }

  get error() {
    return this.geminiService.error();
  }

  get hasMessages() {
    return this.geminiService.hasMessages();
  }

  ngOnInit(): void {
    // Load initial message from service
  }

  async sendMessage(): Promise<void> {
    if (this.userInput.trim()) {
      const message = this.userInput;
      this.userInput = '';
      await this.geminiService.sendMessage(message);
    }
  }

  clearChat(): void {
    this.geminiService.clearMessages();
  }

  // Allow Enter key to send message
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
