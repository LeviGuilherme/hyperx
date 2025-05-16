// src/common/utils.ts
// Common utility functions for HyperX

/**
 * External dependency declaration
 */
declare const htmx: any;

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
