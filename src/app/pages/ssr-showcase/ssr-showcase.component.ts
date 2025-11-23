import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DataItem {
  id: number;
  title: string;
  description: string;
  timestamp: string;
}

@Component({
  selector: 'app-ssr-showcase',
  templateUrl: './ssr-showcase.component.html',
  styleUrl: './ssr-showcase.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class SsrShowcaseComponent {
  items = signal<DataItem[]>([]);
  newTitle = '';
  newDescription = '';
  private nextId = 1;
  serverRenderTime = signal<string>('');

  constructor() {
    // Log when component is rendered
    effect(() => {
      console.log('SSR Showcase rendered. Items:', this.items());
    });

    // Simulate server-rendered data - in real SSR this would come from server
    this.initializeServerData();
  }

  private initializeServerData() {
    // Add some initial items that represent server-rendered data
    this.items.set([
      {
        id: 1,
        title: 'Server-Rendered Item 1',
        description: 'This item was generated on the server',
        timestamp: new Date().toLocaleTimeString()
      },
      {
        id: 2,
        title: 'Server-Rendered Item 2',
        description: 'Server-side rendering ensures faster initial page load',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    this.nextId = 3;
    this.serverRenderTime.set(new Date().toLocaleTimeString());
  }

  addItem() {
    if (this.newTitle.trim() && this.newDescription.trim()) {
      this.items.update(items => [
        {
          id: this.nextId++,
          title: this.newTitle,
          description: this.newDescription,
          timestamp: new Date().toLocaleTimeString()
        },
        ...items
      ]);
      this.newTitle = '';
      this.newDescription = '';
    }
  }

  removeItem(id: number) {
    this.items.update(items => items.filter(item => item.id !== id));
  }
}
