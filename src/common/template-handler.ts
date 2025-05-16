// src/common/template-handler.ts
// Handles template functionality for HyperX

import { 
  triggerHtmxEvent, 
  copyHtmxAttributes, 
  removeHtmxAttributes 
} from './utils';

/**
 * Set up templates with HTMX attributes by creating proxy elements
 * This is needed because HTMX doesn't work directly with template elements
 */
export function setupTemplatesWithHtmx(): void {
  console.log('[HyperX] Setting up templates for HTMX compatibility');
  
  // Find all templates that have hx-* attributes
  const templates = document.querySelectorAll('template[hx-get], template[hx-post], template[hx-put], template[hx-delete]');
  console.log('[HyperX] Found', templates.length, 'templates with HTMX attributes');
  
  templates.forEach(template => {
    // Skip if this template already has a proxy
    const existingProxy = document.getElementById(`${template.id}-proxy`);
    if (existingProxy) {
      console.log('[HyperX] Template already has a proxy:', template.id);
      return;
    }
    
    console.log('[HyperX] Setting up template with HTMX attributes:', template.id);
    
    // Create a proxy element that will trigger the HTMX request
    const proxy = document.createElement('div');
    proxy.style.display = 'none';
    proxy.id = `${template.id}-proxy`;
    
    // Copy all hx-* attributes from the template to the proxy
    copyHtmxAttributes(template as HTMLElement, proxy);
    
    // Remove HTMX attributes from the template to avoid confusion
    removeHtmxAttributes(template as HTMLElement);
    
    // Make sure the proxy targets the template
    if (!proxy.hasAttribute('hx-target')) {
      proxy.setAttribute('hx-target', `#${template.id}`);
    }
    
    // Insert the proxy after the template
    template.parentNode?.insertBefore(proxy, template.nextSibling);
    
    // If the template has hx-trigger="load" or no trigger, trigger it immediately
    const trigger = proxy.getAttribute('hx-trigger') || 'load';
    if (trigger.includes('load')) {
      console.log('[HyperX] Auto-triggering template:', template.id);
      // Use setTimeout to ensure HTMX is fully initialized
      setTimeout(() => {
        triggerHtmxEvent(proxy, 'load');
      }, 100);
    }
  });
}

/**
 * Initialize template handling
 * Sets up event listeners for template handling
 */
export function initializeTemplateHandling(): void {
  // Run setup on htmx:load event
  document.body.addEventListener('htmx:load', setupTemplatesWithHtmx);
  
  // Also run setup on DOMContentLoaded to catch initial templates
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTemplatesWithHtmx);
  } else {
    // Document already loaded, run setup immediately
    setupTemplatesWithHtmx();
  }
}
