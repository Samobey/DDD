# Gemini API Integration with Angular

This demo showcases how to integrate Google's **Gemini API** with Angular 19 following the official Angular documentation pattern.

## Overview

The Gemini demo is a **fully-featured chatbot** that demonstrates:
- ✅ Direct HTTP calls to the Gemini API
- ✅ Signal-based state management for messages and loading states
- ✅ Modern Angular control flow syntax (@if, @for)
- ✅ Secure API key handling via environment variables
- ✅ Error handling and loading indicators
- ✅ Beautiful, responsive UI with animations
- ✅ Client-side rendering (RenderMode.Client) for interactive features

## Architecture

### Service: `GeminiService`
**Location:** `/src/app/services/gemini.service.ts`

Manages all Gemini API communication:
- Signals-based state: `messagesSignal`, `loadingSignal`, `errorSignal`
- Computed signals: `messages()`, `isLoading()`, `error()`, `hasMessages()`
- Core methods:
  - `sendMessage(userMessage: string)` - Sends message and gets AI response
  - `clearMessages()` - Resets conversation
  - Private conversation history management

**Key Features:**
- Maintains conversation history for context-aware responses
- Handles async/await API calls with proper error handling
- Validates API key before making requests
- Generates unique message IDs with timestamps

### Component: `GeminiDemoComponent`
**Location:** `/src/app/pages/gemini-demo/`

Three-file structure:
- `gemini-demo.component.ts` - Component logic with dependency injection
- `gemini-demo.component.html` - Template with modern control flow
- `gemini-demo.component.scss` - Responsive styling with animations

**Features:**
- Real-time message display with role-based styling
- Empty state with example prompts
- Loading indicator with pulsing animation
- Enter key to send (Shift+Enter for newlines)
- Error notifications
- Clear conversation button
- Mobile-responsive design

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/aistudio)
2. Sign in with your Google account (or create one)
3. Click "Create API Key"
4. Copy the API key

### 2. Configure Environment Variable

Add your API key to `/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  geminiApiKey: 'YOUR_GEMINI_API_KEY_HERE'
};
```

### 3. Production Considerations

**Never commit API keys!** For production:

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  geminiApiKey: process.env['GEMINI_API_KEY'] || ''
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  geminiApiKey: process.env['GEMINI_API_KEY'] || ''
};
```

Then set the environment variable:
```bash
export GEMINI_API_KEY=your_key_here
npm run build
```

Or for Angular SSR:
```bash
GEMINI_API_KEY=your_key_here npm run build
```

**Better: Use a Backend Proxy**
For production apps, create a backend endpoint that handles Gemini API calls:

```typescript
// Backend: Node.js/Express
app.post('/api/chat', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  // Call Gemini API server-side
});

// Frontend Angular service
sendMessage(userMessage: string) {
  return this.http.post('/api/chat', { message: userMessage });
}
```

This keeps your API key secure on the server.

## API Details

### Gemini API Endpoint
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_KEY
```

### Request Format
```typescript
interface GeminiRequest {
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
}
```

### Response Format
```typescript
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    index: number;
  }>;
}
```

## Signal-Based State Management

The demo uses Angular Signals for reactive state:

```typescript
// Private signals
private messagesSignal = signal<Message[]>([]);
private loadingSignal = signal(false);
private errorSignal = signal<string | null>(null);

// Public computed signals
public messages = computed(() => this.messagesSignal());
public isLoading = computed(() => this.loadingSignal());
public error = computed(() => this.errorSignal());
public hasMessages = computed(() => this.messagesSignal().length > 0);
```

Benefits:
- Fine-grained reactivity - only affected components update
- Better performance than traditional change detection
- Easier to test and reason about state changes
- Automatic dependency tracking

## Template Syntax

The template uses modern Angular control flow:

```html
<!-- Conditional rendering -->
@if (hasMessages) {
  @for (message of messages; track message.id) {
    <!-- Message display -->
  }
}

@if (!hasMessages) {
  <!-- Empty state -->
}

@if (isLoading) {
  <!-- Loading indicator -->
}

@if (error) {
  <!-- Error message -->
}
```

## Routing Configuration

**Client-side rendering only** - Gemini requires interactive, real-time API calls:

```typescript
// app.routes.ts
{
  path: 'gemini-demo',
  loadComponent: () => import('./pages/gemini-demo/gemini-demo.component')
    .then(m => m.GeminiDemoComponent)
}

// app.routes.server.ts
{
  path: 'gemini-demo',
  renderMode: RenderMode.Client  // CSR only, no SSR
}
```

## Development

Start the dev server:
```bash
npm start
```

Navigate to: `http://localhost:4200/gemini-demo`

## Production Build

Build for production:
```bash
GEMINI_API_KEY=your_key npm run build
```

Test SSR build locally:
```bash
npm run serve:ssr:my-awesome-workspace
```

## Styling

The component includes:
- Gradient background (purple theme)
- Animated message bubbles (slide-in effect)
- User vs. assistant message differentiation
- Pulsing loading indicator
- Responsive mobile design
- Accessibility-friendly colors and contrast

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "API key not configured" | No API key in environment.ts | Add your Gemini API key |
| "Invalid response from Gemini API" | Malformed response | Check API response structure |
| "Failed to get response" | Network error or API down | Check internet connection, retry |
| CORS error | Direct browser call to Google API | Use backend proxy (recommended) |

## Best Practices

1. **Never expose API keys** in client-side code for production
2. **Use environment variables** for configuration
3. **Implement rate limiting** on backend proxy
4. **Add authentication** to your proxy endpoint
5. **Cache responses** when appropriate
6. **Monitor API usage** to control costs
7. **Implement user feedback** for long operations

## References

- [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://ai.google.dev/aistudio)
- [Angular HttpClient Docs](https://angular.dev/api/common/http/HttpClient)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular Control Flow](https://angular.dev/guide/control_flow)

## Example Usage

```typescript
// In your component
constructor(private geminiService: GeminiService) {}

sendMessage() {
  this.geminiService.sendMessage('What is Angular?');
}

// In your template
{{ (geminiService.messages() | async)?.length }} messages
{{ geminiService.isLoading() ? 'Loading...' : 'Ready' }}
{{ geminiService.error() }}
```

## Next Steps

1. ✅ Add persistent chat history (localStorage)
2. ✅ Implement chat sessions/threads
3. ✅ Add text formatting (markdown support)
4. ✅ Implement streaming responses (using ReadableStream)
5. ✅ Add prompt templates/suggestions
6. ✅ Multi-modal support (images, files)
7. ✅ Conversation export (PDF, JSON)
8. ✅ Chat search and filtering
