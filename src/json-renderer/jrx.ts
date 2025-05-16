// src/json-renderer/jrx.ts - Minimal JSON-to-HTML parser for HTMX

/**
 * Render JSON data using a <template> element as the target.
 * - Uses the template itself as the target element
 * - Renders the JSON data using mustache-style interpolation
 * - Replaces the template with the rendered content in the DOM
 */
export function renderJSONWithTemplate(target: HTMLElement, json: any): void {
  // Check if the target is a template element
  const isTemplate = target.tagName === 'TEMPLATE';
  let template: HTMLTemplateElement;
  let parentNode: HTMLElement;
  
  if (isTemplate) {
    // Target is already a template
    template = target as HTMLTemplateElement;
    parentNode = template.parentNode as HTMLElement;
  } else {
    // Look for a template inside the target
    template = target.querySelector('template') as HTMLTemplateElement;
    parentNode = target;
    
    if (!template) {
      console.error('[JRX] No <template> found in or as target element');
      return;
    }
  }
  
  // Get the template content
  const templateHTML = template.innerHTML;
  
  // Render the content
  let rendered = '';
  if (Array.isArray(json)) {
    rendered = json.map(item => interpolate(templateHTML, item)).join('');
  } else {
    rendered = interpolate(templateHTML, json);
  }
  
  // Create a container for the rendered content
  const container = document.createElement('div');
  container.innerHTML = rendered;
  
  // Replace the template with the rendered content
  if (isTemplate) {
    // If target was the template, insert content before the template
    while (container.firstChild) {
      parentNode.insertBefore(container.firstChild, template);
    }
  } else {
    // If target contained the template, replace the template with the content
    template.insertAdjacentHTML('beforebegin', rendered);
    // Keep the template in the DOM but hidden
    template.style.display = 'none';
  }
}

/**
 * Helper function to interpolate template strings with data
 * Supports nested property access with dot notation (e.g., {{ user.name }})
 */
function interpolate(template: string, data: any): string {
  // Log for debugging
  console.log('[JRX] Interpolating template with data:', data);
  
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (match, key) => {
    console.log('[JRX] Found placeholder:', match, 'for key:', key);
    
    const keys = key.split('.');
    let value = data;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.log('[JRX] Value undefined for key:', k);
        return '';
      }
    }
    
    console.log('[JRX] Replacing with value:', value);
    return String(value);
  });
}

// External dependency declaration
declare const htmx: any;
