import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-signals-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signals-demo.component.html',
  styleUrl: './signals-demo.component.scss'
})
export class SignalsDemoComponent {
  // Writable signal
  items = signal<CartItem[]>([]);
  newName = '';
  newPrice = 0;
  private nextId = 1;

  // Computed signals
  itemCount = computed(() => {
    return this.items().reduce((sum, item) => sum + item.quantity, 0);
  });

  totalPrice = computed(() => {
    return Number(
      this.items()
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2)
    );
  });

  averagePrice = computed(() => {
    const count = this.itemCount();
    if (count === 0) return 0;
    return Number((this.totalPrice() / count).toFixed(2));
  });

  constructor() {
    // Effect - logs when cart changes
    effect(() => {
      console.log('Cart updated:', {
        items: this.items(),
        itemCount: this.itemCount(),
        totalPrice: this.totalPrice()
      });
    });
  }

  addItem() {
    if (this.newName.trim() && this.newPrice > 0) {
      this.items.update(items => [
        ...items,
        {
          id: this.nextId++,
          name: this.newName,
          price: this.newPrice,
          quantity: 1
        }
      ]);
      this.newName = '';
      this.newPrice = 0;
    }
  }

  updateQuantity(id: number, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeItem(id);
    } else {
      this.items.update(items =>
        items.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  }

  removeItem(id: number) {
    this.items.update(items => items.filter(item => item.id !== id));
  }

  clearCart() {
    this.items.set([]);
  }
}
