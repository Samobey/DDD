import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div class="app-wrapper">
      <nav class="navbar">
        <div class="nav-container">
          <div class="nav-brand">
            <span class="brand-icon">🅰️</span>
            <span class="brand-text">Angular Advanced</span>
          </div>
          <ul class="nav-links">
            <li><a routerLink="/home" routerLinkActive="active">Home</a></li>
            <li><a routerLink="/signals-demo" routerLinkActive="active">Signals</a></li>
            <li><a routerLink="/hydration-demo" routerLinkActive="active">Hydration</a></li>
            <li><a routerLink="/control-flow-demo" routerLinkActive="active">Control Flow</a></li>
            <li><a routerLink="/ssr-showcase" routerLinkActive="active">SSR</a></li>
            <li><a routerLink="/gemini-demo" routerLinkActive="active">🤖 Gemini</a></li>
            <li><a routerLink="/signal-forms-demo" routerLinkActive="active">📝 Forms</a></li>
          </ul>
        </div>
      </nav>

      <main class="main-content">
        <router-outlet />
      </main>

      <footer class="footer">
        <p>&copy; 2025 Angular | Built with Signals, SSR & Modern APIs</p>
      </footer>
    </div>
  `,
  styles: [`
    * {
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .app-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .navbar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      color: #333;
      padding: 1rem 0;
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .brand-icon {
      font-size: 1.8rem;
    }

    .nav-links {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 2rem;
    }

    .nav-links a {
      color: #333;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-links a:hover {
      color: #667eea;
    }

    .nav-links a.active {
      color: #667eea;
    }

    .nav-links a.active::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }

    .main-content {
      flex: 1;
    }

    .footer {
      background: rgba(51, 51, 51, 0.95);
      color: #ccc;
      text-align: center;
      padding: 1.5rem;
      margin-top: auto;
      font-size: 0.85rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .footer p {
      margin: 0;
    }

    @media (max-width: 768px) {
      .nav-container {
        flex-direction: column;
        gap: 1rem;
        padding: 0 1rem;
      }

      .nav-links {
        gap: 0.5rem;
        flex-wrap: wrap;
        justify-content: center;
      }

      .nav-links a {
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
      }
    }
  `]
})
export class AppComponent {
  title = 'Angular Advanced Demo';
}
