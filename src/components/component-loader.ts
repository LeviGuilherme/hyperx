// src/components/component-loader.ts
// Handles loading .hpx files and registering components

import { componentRegistry } from './component-registry';
import { configLoader } from '../common/config-loader';

// Simple path join function for browser environment
function joinPath(...parts: string[]): string {
  return parts
    .filter(part => part && part !== '.' && part !== './')
    .map((part, index) => {
      // Remove leading/trailing slashes from all parts except the protocol part
      part = part.replace(/^\/+|\/+$/g, '');
      
      // If this is the first part and it looks like a protocol, keep the trailing slash
      if (index === 0 && /^[a-z]+:\/\//i.test(part)) {
        return part.replace(/\/+$/, '') + '//';
      }
      return part;
    })
    .join('/')
    .replace(/([^:])\/\//g, '$1/'); // Replace double slashes not after a protocol
}

/**
 * Interface for component file content
 */
interface ComponentFile {
  name: string;
  content: string;
}

/**
 * Component configuration can be a string or an object with name and path
 */
type ComponentConfig = 
  | string 
  | { 
      name: string; 
      path: string;
      [key: string]: any; // Allow additional properties
    };

/**
 * Normalized component configuration
 */
interface NormalizedComponentConfig {
  name: string;
  path: string;
}

/**
 * Loads and registers components from .hpx files
 */
class ComponentLoader {
  private static instance: ComponentLoader;
  private componentsPath: string = '';
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): ComponentLoader {
    if (!ComponentLoader.instance) {
      ComponentLoader.instance = new ComponentLoader();
    }
    return ComponentLoader.instance;
  }

  /**
   * Initialize the component loader with configuration
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const config = configLoader.getConfig();
    if (!config) {
      throw new Error('Configuration not loaded. Call configLoader.loadConfig() first.');
    }

    this.componentsPath = config.project.componentsDir;
    this.initialized = true;
  }

  /**
   * Load a single component file
   */
  public async loadComponent(componentName: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        console.log(`[HyperX] Initializing before loading component: ${componentName}`);
        await this.initialize();
      }

      // Ensure the component has the correct extension
      const normalizedName = componentName.endsWith('.hpx') ? componentName : `${componentName}.hpx`;
      
      // Get the component path and check if it's in a nested structure
      const { path: filePath, isNested } = await this.getComponentPath(normalizedName);
      console.log(`[HyperX] Loading component from: ${filePath} (${isNested ? 'nested' : 'flat'} structure)`);
      
      // Get CSS path based on the component's structure
      const cssPath = this.getAssetPath(normalizedName, 'css', isNested);
      
      // Check if the component file exists
      const componentExists = await this.fileExists(filePath);
      if (!componentExists) {
        throw new Error(`Component file not found at: ${filePath}`);
      }
      
      // Load component and CSS in parallel
      const [componentResponse, cssContent] = await Promise.all([
        fetch(filePath, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).then(r => r.ok ? r.text() : Promise.reject(new Error(`HTTP error! status: ${r.status}`))),
        this.loadCSSFile(cssPath)
      ]);
      
      // Extract the component's style content
      const styleMatch = componentResponse.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      const componentStyles = styleMatch ? styleMatch[1] : '';
      
      // Process and combine styles
      const processedStyles = this.processStyles(normalizedName, componentStyles, cssContent);
      
      // Create the final content with processed styles
      let finalContent = componentResponse;
      if (styleMatch) {
        // Replace existing style tag with processed styles
        finalContent = componentResponse.replace(
          /<style[^>]*>[\s\S]*?<\/style>/i,
          `<style>\n${processedStyles}\n</style>`
        );
      } else if (processedStyles) {
        // Add style tag if it doesn't exist
        finalContent = `\n<style>\n${processedStyles}\n</style>\n` + componentResponse;
      }
      
      // Register the component with the processed content
      const success = componentRegistry.registerComponent(normalizedName, finalContent);
      if (success) {
        console.log(`[HyperX] Successfully loaded component with styles: ${normalizedName}`);
      } else {
        console.error(`[HyperX] Failed to register component: ${normalizedName}`);
      }
      
      return success;
    } catch (error) {
      console.error(`[HyperX] Error loading component ${componentName}:`, error);
      return false;
    }
  }

  /**
   * Load a CSS file
   */
  private async loadCSSFile(cssPath: string): Promise<string | null> {
    try {
      console.log(`[HyperX] Loading CSS file: ${cssPath}`);
      const response = await fetch(cssPath);
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[HyperX] No CSS file found at: ${cssPath}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return null;
      }
      return await response.text();
    } catch (error) {
      console.error(`[HyperX] Error loading CSS file ${cssPath}:`, error);
      return null;
    }
  }

  /**
   * Process and combine styles with proper scoping
   */
  private processStyles(componentName: string, componentStyles: string, externalStyles: string | null): string {
    // Convert component name to a valid CSS class name
    const componentClass = componentName.replace(/\.hpx$/i, '').toLowerCase();
    const scopedSelector = `.${componentClass}`;
    
    // Process external styles first (lower priority)
    let styles = externalStyles ? 
      externalStyles
        .replace(/([^{}]+){/g, (match: string, selectors: string) => {
          // Skip @ rules
          if (selectors.trim().startsWith('@')) return match;
          // Add scoping to each selector
          return selectors.split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
            .map((selector: string) => {
              // Don't add scoping to :host or :root
              if (selector.includes(':host') || selector.includes(':root')) {
                return selector;
              }
              return `${scopedSelector} ${selector}`;
            })
            .join(', ');
        }) + '\n\n' : '';
    
    // Add component styles (higher priority)
    styles += componentStyles;
    
    return styles;
  }

  /**
   * Check if a file exists at the given URL
   */
  private async fileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the full path for a component file, checking both flat and nested structures
   */
  private async getComponentPath(componentName: string): Promise<{ path: string; isNested: boolean }> {
    // Remove .hpx extension if present
    const baseName = componentName.replace(/\.hpx$/i, '');
    const flatPath = joinPath(this.componentsPath, `${baseName}.hpx`);
    const nestedPath = joinPath(this.componentsPath, baseName, `${baseName}.hpx`);
    
    // First check if the nested structure exists
    const nestedExists = await this.fileExists(nestedPath);
    if (nestedExists) {
      console.log(`[HyperX] Found component in nested structure: ${nestedPath}`);
      return { path: nestedPath, isNested: true };
    }
    
    // Fall back to flat structure
    console.log(`[HyperX] Using flat structure for component: ${flatPath}`);
    return { path: flatPath, isNested: false };
  }

  /**
   * Get the path for a component's asset (like CSS)
   */
  private getAssetPath(componentName: string, extension: string, isNested: boolean): string {
    const baseName = componentName.replace(/\.hpx$/i, '');
    if (isNested) {
      return joinPath(this.componentsPath, baseName, `${baseName}.${extension}`);
    }
    return joinPath(this.componentsPath, `${baseName}.${extension}`);
  }

  /**
   * Load all components specified in the config
   */
  public async loadAllComponents(): Promise<void> {
    console.log('[HyperX] Starting to load all components');
    
    try {
      if (!this.initialized) {
        console.log('[HyperX] Initializing component loader...');
        await this.initialize();
      }

      const config = configLoader.getConfig();
      if (!config) {
        throw new Error('Configuration not loaded');
      }

      // Support both array of strings and array of objects for component configuration
      const components: NormalizedComponentConfig[] = (() => {
        const comps: ComponentConfig[] = Array.isArray(config.components) ? config.components : [];
        
        return comps
          .map(comp => {
            if (typeof comp === 'string') {
              return { name: comp, path: comp };
            }
            return { 
              name: comp.name || comp.path || '',
              path: comp.path || comp.name || ''
            };
          })
          .filter((comp): comp is NormalizedComponentConfig => 
            !!comp.name && !!comp.path
          );
      })();
      
      if (components.length === 0) {
        console.warn('[HyperX] No valid components specified in the configuration');
        return;
      }

      console.log(`[HyperX] Loading ${components.length} components`);
      
      const loadPromises = components.map(component => 
        this.loadComponent(component.path).catch(error => {
          console.error(`[HyperX] Error loading component ${component.name}:`, error);
          return false;
        })
      );

      const results = await Promise.all(loadPromises);
      const successCount = results.filter(Boolean).length;
      
      console.log(`[HyperX] Successfully loaded ${successCount}/${components.length} components`);
      
      if (successCount < components.length) {
        console.warn('[HyperX] Some components failed to load. Check the console for details.');
      }
    } catch (error) {
      console.error('[HyperX] Error loading components:', error);
      throw error;
    }
  }
}

// Export the class for testing and the singleton instance
export { ComponentLoader };
export const componentLoader = ComponentLoader.getInstance();
