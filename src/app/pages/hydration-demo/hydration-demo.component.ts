import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyComponent } from '../../components/lazy-component/lazy.component';

@Component({
  selector: 'app-hydration-demo',
  templateUrl: './hydration-demo.component.html',
  styleUrl: './hydration-demo.component.scss',
  standalone: true,
  imports: [CommonModule, LazyComponent],
})
export class HydrationDemoComponent {
  showDeferred1 = signal(false);
  showDeferred2 = signal(false);
  showDeferred3 = signal(false);
  isScrolling = signal(false);

  prerenderedItems = signal([
    { icon: '🏠', name: 'Home Page' },
    { icon: '⚡', name: 'Signals' },
    { icon: '💧', name: 'Hydration' },
    { icon: '🔄', name: 'Control Flow' },
    { icon: '🖥️', name: 'SSR' }
  ]);

  constructor() {
    // Simulate scroll detection for deferred loading
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolling.set(true);
        setTimeout(() => this.isScrolling.set(false), 500);
      });
    }
  }

  loadAllDeferred() {
    this.showDeferred1.set(true);
    this.showDeferred2.set(true);
    this.showDeferred3.set(true);
  }

  resetDeferred() {
    this.showDeferred1.set(false);
    this.showDeferred2.set(false);
    this.showDeferred3.set(false);
  }
}
