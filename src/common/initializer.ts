// src/common/initializer.ts
// Handles initialization of HyperX

import { initializeHyperX } from '../hyperx';

/**
 * Auto-initialize HyperX when the script is loaded
 * This allows the library to work without manual initialization in HTML
 */
export function setupAutoInitialization(): void {
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[HyperX] Auto-initializing on DOMContentLoaded');
        initializeHyperX();
      });
    } else {
      // Document already loaded, initialize immediately
      console.log('[HyperX] Auto-initializing immediately');
      initializeHyperX();
    }
  }
}

// Run auto-initialization
setupAutoInitialization();
