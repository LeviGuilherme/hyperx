// src/common/utils.ts
// Common utility functions for HyperX

/**
 * External dependency declaration
 */
declare const htmx: any;

// HTMX Utilities
// ==============


/**
 * Trigger an HTMX event programmatically
 */
export function triggerHtmxEvent(element: HTMLElement, eventName: string): void {
  if (typeof htmx !== 'undefined') {
    htmx.trigger(element, eventName);
  } else {
    console.warn('[HyperX] HTMX not found, could not trigger event:', eventName);
  }
}

/**
 * Check if an element has HTMX attributes
 */
export function hasHtmxAttributes(element: HTMLElement): boolean {
  return Array.from(element.attributes).some(attr => attr.name.startsWith('hx-'));
}

/**
 * Copy HTMX attributes from one element to another
 */
export function copyHtmxAttributes(source: HTMLElement, target: HTMLElement): void {
  Array.from(source.attributes).forEach(attr => {
    if (attr.name.startsWith('hx-')) {
      target.setAttribute(attr.name, attr.value);
    }
  });
}

/**
 * Remove HTMX attributes from an element
 */
export function removeHtmxAttributes(element: HTMLElement): void {
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('hx-')) {
      element.removeAttribute(attr.name);
    }
  });
}

// Component Utilities
// ==================


/**
 * Converts a filename to a valid custom element name
 * Example: 'user-card.hpx' -> 'user-card'
 * Example: 'path/to/UserCard.hpx' -> 'user-card'
 */
export function filenameToComponentName(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    console.error('[HyperX] Invalid filename provided to filenameToComponentName');
    return '';
  }

  try {
    // Normalize path separators and convert to lowercase
    let name = filename
      .replace(/\.[^/.]+$/, '')  // Remove file extension
      .replace(/\\/g, '/')      // Normalize path separators
      .split('/')                // Split into path segments
      .pop() || '';              // Get the last segment (filename without path)

    
    // Convert camelCase and PascalCase to kebab-case
    name = name
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
      .toLowerCase();
    
    // Ensure it's a valid component name
    if (!isValidComponentName(name)) {
      console.warn(`[HyperX] Generated invalid component name: ${name} from filename: ${filename}`);
    }
    
    return name;
  } catch (error) {
    console.error(`[HyperX] Error converting filename '${filename}' to component name:`, error);
    return '';
  }
}

/**
 * Extracts the template content from a string
 * Returns null if no template tag is found
 */
export function extractTemplateContent(html: string): string | null {
  if (!html || typeof html !== 'string') {
    console.error('[HyperX] Invalid HTML content provided to extractTemplateContent');
    return null;
  }

  try {
    // Match template tag with any attributes and capture its content
    const templateMatch = html.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
    if (!templateMatch || !templateMatch[1]) {
      console.warn('[HyperX] No valid template tag found in component');
      return null;
    }
    
    const content = templateMatch[1].trim();
    if (!content) {
      console.warn('[HyperX] Empty template content');
      return null;
    }
    
    return content;
  } catch (error) {
    console.error('[HyperX] Error extracting template content:', error);
    return null;
  }
}

/**
 * Validates if a component name is valid for custom elements
 * Must be in kebab-case and contain at least one hyphen
 * Example: 'user-card' is valid, 'usercard' is not
 */
export function isValidComponentName(name: string): boolean {
  // Must contain at least one hyphen
  if (name.indexOf('-') === -1) {
    console.warn(`[HyperX] Component name '${name}' must contain a hyphen`);
    return false;
  }
  
  // Must start with a letter and contain only lowercase letters, numbers, and hyphens
  if (!/^[a-z][a-z0-9\-]*$/.test(name)) {
    console.warn(`[HyperX] Component name '${name}' must be in kebab-case (lowercase with hyphens)`);
    return false;
  }
  
  // Must not start or end with a hyphen
  if (name.startsWith('-') || name.endsWith('-')) {
    console.warn(`[HyperX] Component name '${name}' must not start or end with a hyphen`);
    return false;
  }
  
  // Must not contain consecutive hyphens
  if (/--/.test(name)) {
    console.warn(`[HyperX] Component name '${name}' must not contain consecutive hyphens`);
    return false;
  }
  
  return true;
}

/**
 * Parses the hx-data attribute as JSON
 * Returns an empty object if parsing fails
 */
export function parseComponentData(element: HTMLElement): Record<string, any> {
  const dataAttr = element.getAttribute('hx-data');
  if (!dataAttr) return {};
  
  try {
    return JSON.parse(dataAttr);
  } catch (e) {
    console.error(`[HyperX] Failed to parse hx-data for ${element.tagName}:`, e);
    return {};
  }
}
