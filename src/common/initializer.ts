// src/common/initializer.ts
// Handles initialization of HyperX

import { initializeHyperX } from '../hyperx';

/**
 * Initialize HyperX with proper error handling
 */
async function initialize() {
  try {
    console.log('[HyperX] Initializing HyperX...');
    await initializeHyperX();
    console.log('[HyperX] Initialization complete');
  } catch (error) {
    console.error('[HyperX] Error during initialization:', error);
    // Re-throw to allow handling by the caller if needed
    throw error;
  }
}

/**
 * Auto-initialize HyperX when the script is loaded
 * This allows the library to work without manual initialization in HTML
 */
export function setupAutoInitialization(): void {
  if (typeof document === 'undefined') {
    console.warn('[HyperX] Not in a browser environment, skipping auto-initialization');
    return;
  }

  console.log('[HyperX] Setting up auto-initialization');

  const init = () => {
    initialize().catch(error => {
      console.error('[HyperX] Unhandled error during initialization:', error);
    });
  };

  if (document.readyState === 'loading') {
    // DOM is still loading, wait for it
    console.log('[HyperX] Waiting for DOM to load...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[HyperX] DOM loaded, initializing...');
      init();
    });
  } else {
    // DOM is already loaded, initialize immediately
    console.log('[HyperX] DOM already loaded, initializing immediately');
    init();
  }
}

// Run auto-initialization when this module is imported
setupAutoInitialization();
