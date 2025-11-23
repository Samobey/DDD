import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lazy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lazy.component.html',
  styleUrl: './lazy.component.scss'
})
export class LazyComponent {
  loadTime = Math.random() * 500 + 100;
}
