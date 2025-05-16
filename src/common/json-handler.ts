// src/common/json-handler.ts
// Handles JSON response processing for HyperX

import { renderJSONWithTemplate } from '../json-renderer/jrx';

/**
 * Setup JSON response handling
 * Adds event listeners to intercept and process JSON responses from HTMX
 */
export function setupJsonResponseHandling(): void {
  // Add event listener for JSON responses - use beforeSwap to intercept before HTMX processes the response
  document.body.addEventListener('htmx:beforeSwap', function(event) {
    const evt = event as CustomEvent;
    const target = evt.detail.target as HTMLElement;
    const xhr = evt.detail.xhr as XMLHttpRequest;
    const contentType = xhr.getResponseHeader('Content-Type');
    
    // Only process JSON responses
    if (contentType && contentType.includes('application/json')) {
      try {
        const jsonData = JSON.parse(xhr.responseText);
        console.log('[HyperX] JSON data received for target:', target.id);
        
        // Handle the case where the target is a template or contains a template
        renderJSONWithTemplate(target, jsonData);
        evt.detail.shouldSwap = false; // Prevent HTMX from swapping HTML
      } catch (e) {
        console.error('[HyperX] JSON parse error:', e);
      }
    }
  });
}
