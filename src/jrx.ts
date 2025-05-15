// src/jrx.ts - HTMX extension for rendering JSON with templates

// Add TypeScript declaration for HTMX
declare const htmx: any;

/**
 * Interface for the JRX context object
 */
interface JRXContext {
  target: HTMLElement;
  json: any;
}

/**
 * Render JSON data using <template> elements inside the target.
 */
function renderJRX(ctx: JRXContext): void {
  const { target, json } = ctx;

  console.log('[JRX] Rendering JSON data in target:', target);

  // Get the main <template> (assume only one)
  const template = target.querySelector('template');
  if (!template) {
    console.error('[JRX] No template found in target element');
    console.log('[JRX] Target HTML:', target.innerHTML);
    return;
  }
  
  console.log('[JRX] Found template:', template);
  
  // Prepare fallback nodes
  const fallbackNodes: Record<string, HTMLElement[]> = {
    empty: [],
    error: []
  };

  // Create a temporary container to parse template content
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = template.innerHTML;
  console.log('[JRX] Template content:', template.innerHTML);

  const children = Array.from(tempContainer.children);

  // Extract fallback elements and main template structure
  const fallbackKeys = Object.keys(fallbackNodes);
  const mainContent: HTMLElement[] = [];

  for (const child of children) {
    const hxIf = child.getAttribute('hx-if');
    if (hxIf && fallbackKeys.includes(hxIf)) {
      fallbackNodes[hxIf].push(child.cloneNode(true) as HTMLElement);
    } else {
      mainContent.push(child as HTMLElement);
    }
  }

  // Save the template for later use
  const savedTemplate = template.cloneNode(true) as HTMLTemplateElement;
  
  // Clear the target content
  target.innerHTML = '';
  
  // Simple condition helpers
  const isEmpty = (data: any) => Array.isArray(data) && data.length === 0;
  const isError = (data: any) => typeof data === 'object' && data !== null && data.error;

  if (isEmpty(json)) {
    fallbackNodes.empty.forEach(node => target.append(node));
    return;
  }

  if (isError(json)) {
    fallbackNodes.error.forEach(node => target.append(node));
    return;
  }

  if (Array.isArray(json)) {
    json.forEach(item => {
      const rendered = renderNodes(mainContent, item);
      target.insertAdjacentHTML('beforeend', rendered);
    });
  } else {
    const rendered = renderNodes(mainContent, json);
    target.insertAdjacentHTML('beforeend', rendered);
  }
  
  // Add the template back but hide it
  savedTemplate.style.display = 'none';
  target.appendChild(savedTemplate);
}

/**
 * Renders a set of nodes with data
 */
function renderNodes(nodes: HTMLElement[], data: Record<string, any>): string {
  return nodes.map(node => {
    const clone = node.cloneNode(true) as HTMLElement;
    return applyTemplate(clone, data);
  }).join('');
}

/**
 * Applies template variables to an element
 */
function applyTemplate(element: HTMLElement, data: Record<string, any>): string {
  const html = element.outerHTML.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_match, path) => {
    // Handle nested properties like "user.name"
    const keys = path.split('.');
    let value = data;
    
    for (const key of keys) {
      if (value === undefined || value === null) return '';
      value = value[key];
    }
    
    // Ensure we always return a string
    return value !== undefined && value !== null ? String(value) : '';
  });
  return html;
}

/**
 * Process template content with JSON data
 * This function directly processes the template content and returns the processed DOM
 */
function processTemplateContent(container: HTMLElement, data: any): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const fallbackNodes: Record<string, HTMLElement[]> = {
    empty: [],
    error: []
  };
  
  // Process all children in the container
  const children = Array.from(container.children);
  const fallbackKeys = Object.keys(fallbackNodes);
  const mainContent: HTMLElement[] = [];
  
  // Extract fallback elements and main content
  for (const child of children) {
    const hxIf = child.getAttribute('hx-if');
    if (hxIf && fallbackKeys.includes(hxIf)) {
      fallbackNodes[hxIf].push(child.cloneNode(true) as HTMLElement);
    } else {
      mainContent.push(child as HTMLElement);
    }
  }
  
  // Simple condition helpers
  const isEmpty = (data: any) => Array.isArray(data) && data.length === 0;
  const isError = (data: any) => typeof data === 'object' && data !== null && data.error;
  
  // Handle empty data
  if (isEmpty(data)) {
    fallbackNodes.empty.forEach(node => fragment.appendChild(node));
    return fragment;
  }
  
  // Handle error data
  if (isError(data)) {
    fallbackNodes.error.forEach(node => fragment.appendChild(node));
    return fragment;
  }
  
  // Process the data
  if (Array.isArray(data)) {
    // For arrays, render each item
    data.forEach(item => {
      mainContent.forEach(node => {
        const clone = node.cloneNode(true) as HTMLElement;
        // Process template variables
        clone.innerHTML = clone.innerHTML.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_match, path) => {
          // Handle nested properties
          const keys = path.split('.');
          let value = item;
          
          for (const key of keys) {
            if (value === undefined || value === null) return '';
            value = value[key];
          }
          
          return value !== undefined && value !== null ? String(value) : '';
        });
        fragment.appendChild(clone);
      });
    });
  } else {
    // For single objects, render once
    mainContent.forEach(node => {
      const clone = node.cloneNode(true) as HTMLElement;
      // Process template variables
      clone.innerHTML = clone.innerHTML.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_match, path) => {
        // Handle nested properties
        const keys = path.split('.');
        let value = data;
        
        for (const key of keys) {
          if (value === undefined || value === null) return '';
          value = value[key];
        }
        
        return value !== undefined && value !== null ? String(value) : '';
      });
      fragment.appendChild(clone);
    });
  }
  
  return fragment;
}

// Store templates for each target element
const templateStore: Record<string, HTMLTemplateElement> = {};

// Initialize the extension when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('[JRX] Initializing extension...');
  
  // Make sure HTMX is available
  if (typeof htmx === 'undefined') {
    console.error('[JRX] HTMX not found! Make sure HTMX is loaded before JRX.');
    return;
  }
  
  // Find all templates in the document and store them by name attribute
  document.querySelectorAll('template[name]').forEach((template) => {
    const templateName = template.getAttribute('name');
    if (templateName) {
      templateStore[templateName] = template.cloneNode(true) as HTMLTemplateElement;
      console.log(`[JRX] Stored template with name="${templateName}"`);
    }
  });
  
  // Also find templates with data-for attribute (for backward compatibility)
  document.querySelectorAll('template[data-for]').forEach((template) => {
    const templateFor = template.getAttribute('data-for');
    if (templateFor) {
      templateStore[templateFor] = template.cloneNode(true) as HTMLTemplateElement;
      console.log(`[JRX] Stored template for #${templateFor} (via data-for)`);
    }
  });
  
  // Find templates with id attribute
  document.querySelectorAll('template[id]').forEach((template) => {
    const templateId = template.getAttribute('id');
    if (templateId) {
      templateStore[templateId] = template.cloneNode(true) as HTMLTemplateElement;
      console.log(`[JRX] Stored template with id #${templateId}`);
    }
  });
  
  // Register a global event handler for all HTMX events
  document.body.addEventListener('htmx:beforeRequest', function(event) {
    const evt = event as CustomEvent;
    const target = evt.detail.elt as HTMLElement;
    
    // Store any templates before the request
    if (target.id) {
      // Check for template inside the target
      const inlineTemplate = target.querySelector('template');
      if (inlineTemplate) {
        templateStore[target.id] = inlineTemplate.cloneNode(true) as HTMLTemplateElement;
        console.log(`[JRX] Stored inline template for #${target.id} before request`);
        return;
      }
      
      // Check for template with name attribute matching target id
      const namedTemplate = document.querySelector(`template[name="${target.id}"]`);
      if (namedTemplate) {
        templateStore[target.id] = namedTemplate.cloneNode(true) as HTMLTemplateElement;
        console.log(`[JRX] Stored template with name="${target.id}" before request`);
        return;
      }
      
      // Check for template with data-for attribute (backward compatibility)
      const referencedTemplate = document.querySelector(`template[data-for="${target.id}"]`);
      if (referencedTemplate) {
        templateStore[target.id] = referencedTemplate.cloneNode(true) as HTMLTemplateElement;
        console.log(`[JRX] Stored referenced template for #${target.id} before request`);
      }
    }
  });
  
  document.body.addEventListener('htmx:afterOnLoad', function(event) {
    const evt = event as CustomEvent;
    const target = evt.detail.target as HTMLElement;
    const xhr = evt.detail.xhr as XMLHttpRequest;
    const contentType = xhr.getResponseHeader('Content-Type');
    
    // Only process JSON responses
    if (!contentType || !contentType.includes('application/json')) {
      return;
    }
    
    console.log('[JRX] Processing JSON response for:', {
      target,
      targetId: target.id,
      isTemplate: target.tagName === 'TEMPLATE'
    });
    
    try {
      // Parse the JSON data
      const jsonData = JSON.parse(xhr.responseText);
      let template = null;
      let renderTarget = null;
      
      // Check if the target itself is a template element
      if (target.tagName === 'TEMPLATE') {
        console.log('[JRX] Target is a template element');
        template = target as HTMLTemplateElement;
        
        // Create a container element to replace the template
        renderTarget = document.createElement('div');
        renderTarget.id = target.id; // Preserve the ID
        renderTarget.className = 'jrx-container'; // Add a class for styling
        
        // Replace the template with the container
        target.parentNode?.insertBefore(renderTarget, target);
        target.style.display = 'none'; // Hide the template, but keep it in the DOM
      } else {
        // Target is a regular element, look for a template
        renderTarget = target;
        
        if (target.id) {
          // First check if there's a template in the target
          template = target.querySelector('template');
          
          // If no template in the DOM, check for a template with name attribute
          if (!template) {
            const namedTemplate = document.querySelector(`template[name="${target.id}"]`);
            if (namedTemplate) {
              console.log(`[JRX] Using template with name="${target.id}"`);
              template = namedTemplate.cloneNode(true) as HTMLTemplateElement;
            }
          }
          
          // If still no template, try to get it from our store
          if (!template && templateStore[target.id]) {
            console.log(`[JRX] Restoring template for #${target.id} from store`);
            template = templateStore[target.id].cloneNode(true) as HTMLTemplateElement;
          }
          
          // If still no template, check for data-for attribute (backward compatibility)
          if (!template) {
            const referencedTemplate = document.querySelector(`template[data-for="${target.id}"]`);
            if (referencedTemplate) {
              console.log(`[JRX] Using template with data-for="${target.id}"`);
              template = referencedTemplate.cloneNode(true) as HTMLTemplateElement;
            }
          }
        }
      }
      
      // If we found a template and a render target, use them to render the JSON data
      if (template && renderTarget) {
        // Create a temporary container with the template content
        const tempContainer = document.createElement('div');
        tempContainer.appendChild(template.content.cloneNode(true));
        
        // Process the template content with the JSON data
        const processedContent = processTemplateContent(tempContainer, jsonData);
        
        // Replace the render target's content with the processed template content
        renderTarget.innerHTML = '';
        while (processedContent.firstChild) {
          renderTarget.appendChild(processedContent.firstChild);
        }
        
        console.log('[JRX] Rendered template content directly into', renderTarget);
        evt.detail.shouldSwap = false; // Prevent HTMX from swapping HTML
      } else {
        console.log('[JRX] No template or render target found, letting HTMX handle the response');
        // Let HTMX handle the response normally
      }
    } catch (e) {
      console.error('[JRX] JSON parse error:', e);
    }
  });
  
  console.log('[JRX] Global JSON rendering enabled');
});
  