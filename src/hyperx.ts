// src/hyperx.ts
// Main entrypoint for Hyper eXtensions (HTMX extensions)

// Import extensions
import { renderJSONWithTemplate } from './json-renderer/jrx';
import { setupConditionalRendering } from './conditions/hx-conditions';
import { setupComponentSystem } from './components/hx-components';

// Import common functionality
import { setupJsonResponseHandling } from './common/json-handler';
import { initializeTemplateHandling } from './common/template-handler';

// Import auto-initialization (this will auto-execute)
import './common/initializer';

/**
 * Initialize all HyperX extensions
 */
export async function initializeHyperX(): Promise<void> {
  console.log('[HyperX] Initializing all extensions');
  
  // Initialize core extensions
  setupConditionalRendering();
  await setupComponentSystem();
  
  // Initialize common functionality
  setupJsonResponseHandling();
  initializeTemplateHandling();
}

// Create the HyperX namespace
const HyperX = {
  renderJSONWithTemplate,
  setupConditionalRendering,
  setupComponentSystem,
  initializeHyperX
};

// Explicitly assign to window object
(window as any).HyperX = HyperX;

// Log when the library is loaded
console.log('[HyperX] Library loaded');

// Export default for Webpack
export default HyperX;

// Also export individual functions
export {
  renderJSONWithTemplate,
  setupConditionalRendering,
  setupComponentSystem
};

