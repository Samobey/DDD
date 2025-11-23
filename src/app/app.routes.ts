import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'signals-demo',
    loadComponent: () => import('./pages/signals-demo/signals-demo.component').then(m => m.SignalsDemoComponent)
  },
  {
    path: 'hydration-demo',
    loadComponent: () => import('./pages/hydration-demo/hydration-demo.component').then(m => m.HydrationDemoComponent)
  },
  {
    path: 'control-flow-demo',
    loadComponent: () => import('./pages/control-flow-demo/control-flow-demo.component').then(m => m.ControlFlowDemoComponent)
  },
  {
    path: 'ssr-showcase',
    loadComponent: () => import('./pages/ssr-showcase/ssr-showcase.component').then(m => m.SsrShowcaseComponent)
  },
  {
    path: 'gemini-demo',
    loadComponent: () => import('./pages/gemini-demo/gemini-demo.component').then(m => m.GeminiDemoComponent)
  },
  {
    path: 'signal-forms-demo',
    loadComponent: () => import('./pages/signal-forms-demo/signal-forms-demo.component').then(m => m.SignalFormsDemoComponent)
  }
];
