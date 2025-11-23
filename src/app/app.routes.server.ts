import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Client-side rendering - for dynamic content with API calls
  {
    path: 'gemini-demo',
    renderMode: RenderMode.Client
  },
  {
    path: 'signal-forms-demo',
    renderMode: RenderMode.Client
  },
  // Prerender - static generation with hydration for interactivity
  {
    path: 'home',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'signals-demo',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'hydration-demo',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'control-flow-demo',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'ssr-showcase',
    renderMode: RenderMode.Server
  },
  // Fallback
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
