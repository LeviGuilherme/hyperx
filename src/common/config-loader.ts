// src/common/config-loader.ts
// Handles loading and validating the HPX configuration

// Using a simple path join function for browser environment
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

export interface ProjectConfig {
  name: string;
  description: string;
  version: string;
  author: string;
  license: string;
  rootDir: string;
  componentsDir: string;
  [key: string]: any;
}

export interface ServerConfig {
  port: number;
  open: boolean;
  [key: string]: any;
}

export interface HpxConfig {
  version: string;
  project: ProjectConfig;
  server: ServerConfig;
  components: string[];
  [key: string]: any;
}

const DEFAULT_CONFIG: Partial<HpxConfig> = {
  version: '1.0.0',
  project: {
    name: 'HyperX App',
    description: 'A HyperX application',
    version: '1.0.0',
    author: '',
    license: 'MIT',
    rootDir: '.',
    componentsDir: './components'
  },
  server: {
    port: 3000,
    open: true
  },
  components: []
};

class ConfigLoader {
  private static instance: ConfigLoader;
  private config: HpxConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Get the current configuration
   */
  /**
   * Check if configuration is loaded
   */
  public isConfigLoaded(): boolean {
    return this.config !== null;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): HpxConfig | null {
    return this.config;
  }

  /**
   * Load and validate the configuration file
   */
  public async loadConfig(configPath: string = './hpxconfig.json'): Promise<HpxConfig> {
    try {
      // In the browser, we'll use fetch to get the config file
      const response = await fetch(configPath);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      
      const userConfig = await response.json();
      
      // Merge with defaults
      this.config = {
        ...DEFAULT_CONFIG,
        ...userConfig,
        project: {
          ...DEFAULT_CONFIG.project,
          ...(userConfig.project || {})
        },
        server: {
          ...DEFAULT_CONFIG.server,
          ...(userConfig.server || {})
        }
      } as HpxConfig;

      // In the browser, we'll assume paths are relative to the current URL
      const baseUrl = window.location.origin;
      const currentPath = window.location.pathname.replace(/\/[^/]*$/, '');
      
      // Handle root directory
      let rootDir = this.config.project.rootDir;
      if (!rootDir.startsWith('http')) {
        if (rootDir.startsWith('/')) {
          // Absolute path from the domain root
          rootDir = joinPath(baseUrl, rootDir);
        } else if (rootDir.startsWith('./')) {
          // Relative to current path
          rootDir = joinPath(baseUrl, currentPath, rootDir.substring(2));
        } else if (rootDir.startsWith('../')) {
          // Relative to parent path (simplified handling)
          const parentPath = currentPath.replace(/\/[^/]*$/, '');
          rootDir = joinPath(baseUrl, parentPath, rootDir.substring(3));
        } else {
          // Relative to current path
          rootDir = joinPath(baseUrl, currentPath, rootDir);
        }
      }
      
      // Handle components directory
      let componentsDir = this.config.project.componentsDir;
      if (!componentsDir.startsWith('http')) {
        if (componentsDir.startsWith('/')) {
          // Absolute path from the domain root
          componentsDir = joinPath(baseUrl, componentsDir);
        } else if (componentsDir.startsWith('./')) {
          // Relative to rootDir
          componentsDir = joinPath(rootDir, componentsDir.substring(2));
        } else if (componentsDir.startsWith('../')) {
          // Relative to rootDir's parent
          const parentPath = rootDir.replace(/\/[^/]*$/, '');
          componentsDir = joinPath(parentPath, componentsDir.substring(3));
        } else {
          // Relative to rootDir
          componentsDir = joinPath(rootDir, componentsDir);
        }
      }
      
      this.config.project.rootDir = rootDir;
      this.config.project.componentsDir = componentsDir;
      
      console.log('[HyperX] Config paths resolved:', {
        baseUrl,
        currentPath,
        rootDir: this.config.project.rootDir,
        componentsDir: this.config.project.componentsDir
      });

      return this.config;
    } catch (error) {
      console.error('[HyperX] Failed to load config file, using defaults:', error);
      // Return defaults but with URLs set up correctly
      const defaults = { ...DEFAULT_CONFIG } as HpxConfig;
      const baseUrl = window.location.href.replace(/\/[^/]*$/, '');
      defaults.project.rootDir = baseUrl;
      defaults.project.componentsDir = joinPath(baseUrl, 'components');
      return defaults;
    }
  }
}

// Export the ConfigLoader class and a singleton instance
export { ConfigLoader };

export const configLoader = ConfigLoader.getInstance();

// Ensure config is loaded when this module is imported
configLoader.loadConfig('../hpxconfig.json').catch(error => {
  console.error('[HyperX] Failed to load config:', error);
});
