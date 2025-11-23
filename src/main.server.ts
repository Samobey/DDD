import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import { serverRoutes } from './app/app.routes.server';

const bootstrap = (context: BootstrapContext) => {
  // In Angular v21+, pass serverRoutes via context
  const enhancedContext = { ...context, serverRoutes };
  return bootstrapApplication(AppComponent, config, enhancedContext as any);
};

export default bootstrap;
