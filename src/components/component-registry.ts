// src/components/component-registry.ts
// Manages registration and retrieval of dynamic components

import { extractTemplateContent, isValidComponentName } from '../common/utils';

interface ComponentDefinition {
  name: string;
  template: string;
}

class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  /**
   * Register a new component
   */
  public registerComponent(filename: string, content: string): boolean {
    try {
      console.log(`[HyperX] Registering component from file: ${filename}`);
      
      if (!filename || typeof filename !== 'string') {
        throw new Error('Invalid filename provided');
      }
      
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid content provided');
      }
      
      const name = filenameToComponentName(filename);
      console.log(`[HyperX] Normalized component name: ${name}`);
      
      if (!isValidComponentName(name)) {
        throw new Error(`Invalid component name: ${name}. Must be kebab-case and contain a hyphen`);
      }
      
      console.log(`[HyperX] Extracting template content...`);
      const template = extractTemplateContent(content);
      if (!template) {
        throw new Error('No valid template found in component file');
      }
      
      console.log(`[HyperX] Template content extracted successfully (${template.length} chars)`);
      
      this.components.set(name, template);
      console.log(`[HyperX] Successfully registered component: ${name}`);
      return true;
    } catch (error) {
      console.error(`[HyperX] Failed to register component from ${filename}:`, error);
      return false;
    }
  }

  /**
   * Get a component's template by name
   */
  public getComponentTemplate(name: string): string | undefined {
    return this.components.get(name);
  }

  /**
   * Check if a component is registered
   */
  public hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Clear all registered components
   */
  public clear(): void {
    this.components.clear();
  }
}

// Re-export the singleton instance
export const componentRegistry = ComponentRegistry.getInstance();

// Helper function to get the component name from a filename
export function filenameToComponentName(filename: string): string {
  return filename
    .replace(/\.?\\/g, '/') // Normalize path separators
    .replace(/^.*\//, '')   // Remove path
    .replace(/\.hpx$/i, '')  // Remove .hpx extension
    .toLowerCase();
}
