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

      const fileName = componentName.endsWith('.hpx') ? componentName : `${componentName}.hpx`;
      
      // Get the base URL for components
      const config = configLoader.getConfig();
      if (!config) {
        const error = new Error('Configuration not loaded');
        console.error('[HyperX]', error.message);
        throw error;
      }

      // Use the resolved components directory from config
      const filePath = joinPath(config.project.componentsDir, fileName);
      
      console.log(`[HyperX] Loading component from: ${filePath}`);
      
      const response = await fetch(filePath, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status} for ${filePath}`);
        console.error('[HyperX]', error.message);
        throw error;
      }
      
      const content = await response.text();
      
      if (!content) {
        const error = new Error(`Empty content for component: ${componentName}`);
        console.error('[HyperX]', error.message);
        throw error;
      }
      
      const result = componentRegistry.registerComponent(componentName, content);
      if (!result) {
        console.error(`[HyperX] Failed to register component: ${componentName}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`[HyperX] Failed to load component ${componentName}:`, error);
      return false;
    }
  }

  /**
   * Load all components specified in the config
   */
  public async loadAllComponents(): Promise<void> {
    console.log('[HyperX] Starting to load all components');
    
    if (!this.initialized) {
      console.log('[HyperX] Initializing component loader...');
      await this.initialize();
    }

    const config = configLoader.getConfig();
    if (!config) {
      const error = new Error('Configuration not loaded');
      console.error('[HyperX]', error.message);
      throw error;
    }

    if (!config.components || !Array.isArray(config.components)) {
      console.warn('[HyperX] No components defined in config');
      return;
    }

    console.log(`[HyperX] Loading ${config.components.length} components:`, config.components);
    
    try {
      const loadPromises = config.components.map((component: string) => {
        console.log(`[HyperX] Loading component: ${component}`);
        return this.loadComponent(component).then(success => {
          if (success) {
            console.log(`[HyperX] Successfully loaded component: ${component}`);
          } else {
            console.error(`[HyperX] Failed to load component: ${component}`);
          }
          return success;
        });
      });
      
      const results = await Promise.all(loadPromises);
      const successCount = results.filter(Boolean).length;
      console.log(`[HyperX] Loaded ${successCount}/${config.components.length} components successfully`);
      
      if (successCount < config.components.length) {
        throw new Error(`Failed to load ${config.components.length - successCount} components`);
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
