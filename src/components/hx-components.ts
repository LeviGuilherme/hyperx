// src/components/hx-components.ts
// Component system extension for HTMX

import { componentRegistry } from './component-registry';
import { componentLoader } from './component-loader';
import { parseComponentData } from '../common/utils';
import { configLoader } from '../common/config-loader';

// External dependency declaration
declare const htmx: any;

/**
 * Registers a custom element with the given name and template
 */
function registerComponentElement(tagName: string): void {
  console.log(`[HyperX] Attempting to register component: ${tagName}`);
  
  try {
    if (!tagName || typeof tagName !== 'string') {
      throw new Error(`Invalid tag name: ${tagName}`);
    }

    // Check if the component is already registered
    if (customElements.get(tagName)) {
      console.warn(`[HyperX] Component ${tagName} is already registered`);
      return;
    }

    // Check if we have a template for this component
    if (!componentRegistry.hasComponent(tagName)) {
      throw new Error(`No template found for component: ${tagName}`);
    }

  class HyperXComponent extends HTMLElement {
    private hasRendered = false;
    private shadow: ShadowRoot;

    static get observedAttributes() {
      return ['hx-data', 'hx-trigger'];
    }

    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      if (this.hasRendered) return;
      this.render();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if ((name === 'hx-data' || name === 'hx-trigger') && oldValue !== newValue) {
        this.render();
      }
    }

    private render() {
      try {
        console.log(`[HyperX] Rendering component: ${tagName}`);
        
        const template = componentRegistry.getComponentTemplate(tagName);
        if (!template) {
          console.error(`[HyperX] No template found for component: ${tagName}`);
          return;
        }

        // Clear existing content
        this.shadow.innerHTML = '';
        
        // Create a container for the template
        const content = document.createElement('div');
        
        try {
          // Process data bindings
          const data = parseComponentData(this);
          console.log(`[HyperX] Component data:`, data);
          
          // Replace template variables with data
          let processedHtml = template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
            const value = key.split('.').reduce((obj: any, k: string) => {
              if (obj === null || obj === undefined) return '';
              return obj[k.trim()];
            }, data);
            
            // Handle undefined values gracefully
            return value !== undefined ? String(value) : '';
          });
          
          content.innerHTML = processedHtml;
          
          // Process HTMX attributes before appending to shadow DOM
          this.processHTMX(content);
          
          // Append the content to the shadow DOM
          this.shadow.appendChild(content);
          
          // Process HTMX after content is added
          const htmx = (window as any).htmx as {
            process: (el: HTMLElement) => void;
            trigger: (el: HTMLElement, eventName: string, detail?: any) => void;
          };
          
          if (htmx) {
            try {
              // Process the shadow root's children, not the shadow root itself
              const children = Array.from(this.shadow.children);
              children.forEach(child => {
                if (child instanceof HTMLElement) {
                  htmx.process(child);
                }
              });
              
              // Trigger any load events
              const loadElements = this.shadow.querySelectorAll<HTMLElement>('[hx-trigger*="load"]');
              loadElements.forEach(el => {
                htmx.trigger(el, 'load');
              });
            } catch (htmxError) {
              console.error(`[HyperX] Error processing HTMX:`, htmxError);
            }
          }
          
          console.log(`[HyperX] Successfully rendered component: ${tagName}`);
          this.hasRendered = true;
          
        } catch (templateError) {
          console.error(`[HyperX] Error processing template for ${tagName}:`, templateError);
          this.shadow.innerHTML = `
            <div style="color: red; padding: 1em; border: 1px solid red; margin: 0.5em 0;">
              <strong>Error rendering component: ${tagName}</strong>
              <pre>${String(templateError)}</pre>
            </div>
          `;
        }
        
      } catch (error) {
        console.error(`[HyperX] Fatal error rendering component ${tagName}:`, error);
        this.shadow.innerHTML = `
          <div style="color: red; padding: 1em; border: 1px solid red; margin: 0.5em 0;">
            <strong>Fatal error rendering component: ${tagName}</strong>
            <pre>${String(error)}</pre>
          </div>
        `;
      }
    }
    
    private processHTMX(node: HTMLElement | DocumentFragment) {
      // Process data attributes for HTMX
      if (!(node instanceof HTMLElement)) {
        // If it's a DocumentFragment, process its children
        const children = Array.from(node.children);
        children.forEach(child => this.processHTMX(child as HTMLElement));
        return;
      }
      const elements = node.querySelectorAll<HTMLElement>('[hx-data]');
      elements.forEach(el => {
        try {
          // Get data from the component's hx-data attribute
          const componentData = this.getAttribute('hx-data');
          if (componentData) {
            const data = JSON.parse(componentData) as Record<string, unknown>;
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                const value = data[key];
                // Set data attributes for HTMX to use
                if (value !== null && value !== undefined) {
                  el.dataset[key] = String(value);
                }
              }
            }
          }
          
          // Also process any inline hx-data
          const inlineData = el.getAttribute('hx-data');
          if (inlineData) {
            const data = JSON.parse(inlineData) as Record<string, unknown>;
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                const value = data[key];
                if (value !== null && value !== undefined) {
                  el.dataset[key] = String(value);
                }
              }
            }
          }
        } catch (e) {
          console.error(`[HyperX] Error parsing hx-data for ${tagName}:`, e);
        }
      });
    }
  }

    customElements.define(tagName, HyperXComponent);
    console.log(`[HyperX] Successfully registered component: ${tagName}`);
  } catch (error) {
    console.error(`[HyperX] Failed to register component ${tagName}:`, error);
    throw error; // Re-throw to ensure we don't silently fail
  }
}

/**
 * Sets up the component system
 */
export async function setupComponentSystem(): Promise<void> {
  console.log('[HyperX] Setting up component system');
  
  // Watch for dynamically added components
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();
          
          // If this is a known component but not yet registered
          if (componentRegistry.hasComponent(tagName) && !customElements.get(tagName)) {
            registerComponentElement(tagName);
          }
        }
      }
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });
  
  try {
    console.log('[HyperX] Starting component system initialization');
    
    // First, ensure the config is loaded
    if (!configLoader.isConfigLoaded()) {
      console.log('[HyperX] Loading configuration...');
      await configLoader.loadConfig('../hpxconfig.json');
    }
    
    const config = configLoader.getConfig();
    if (!config) {
      throw new Error('Failed to load configuration');
    }
    
    console.log('[HyperX] Configuration loaded:', config);
    
    // Initialize the component loader
    console.log('[HyperX] Initializing component loader...');
    await componentLoader.initialize();
    
    // Load all components
    console.log('[HyperX] Loading components...');
    await componentLoader.loadAllComponents();
    
    // Register any components that were already in the DOM
    console.log('[HyperX] Registering components in the DOM...');
    const elements = document.querySelectorAll('*');
    console.log(`[HyperX] Found ${elements.length} elements to check for components`);
    
    elements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      if (tagName.includes('-')) { // Only process custom elements
        console.log(`[HyperX] Found custom element: ${tagName}`);
        if (componentRegistry.hasComponent(tagName)) {
          if (!customElements.get(tagName)) {
            console.log(`[HyperX] Registering component: ${tagName}`);
            registerComponentElement(tagName);
          } else {
            console.log(`[HyperX] Component already registered: ${tagName}`);
          }
        } else {
          console.warn(`[HyperX] No template found for component: ${tagName}`);
        }
      }
    });
    
    console.log('[HyperX] Component system ready');
  } catch (error) {
    console.error('[HyperX] Error initializing component system:', error);
    throw error;
  }
}

// Export the component loader for manual control
export { ComponentLoader } from './component-loader';
