// Type definitions for HTMX
declare namespace htmx {
  function process(elt: Element): void;
  function trigger(elt: Element, eventName: string, detail?: any): void;
  // Add other HTMX methods as needed
}

declare global {
  interface Window {
    htmx: typeof htmx;
  }
}
