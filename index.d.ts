/**
 * TypeScript type definitions for vue-cli-plugin-browser-extension
 */

import { PluginAPI, VueUsePluginOptions } from '@vue/cli-service/types'

export interface BrowserExtensionComponents {
  background?: boolean | string | {
    entry?: string;
    template?: string;
  };
  contentScripts?: boolean | string | {
    entries?: string[];
    template?: string;
  };
  options?: boolean | string;
  popup?: boolean | string;
  devtools?: boolean | string;
  backgroundWorker?: boolean | string;
}

export interface BrowserExtensionComponentOptions {
  entries?: Record<string, string>;
  template?: string;
}

export interface BrowserExtensionManifestSync {
  version?: boolean;
  name?: boolean;
  description?: boolean;
  icons?: boolean;
}

export interface BrowserExtensionManifestTransformer {
  /**
   * Transform the manifest.json file
   */
  transform?: (manifest: Record<string, unknown>) => Record<string, unknown>;
}

export interface ExtensionReloaderOptions {
  manifest?: string;
  entries?: string[];
}

export interface BrowserExtensionOptions {
  /**
   * Components to include in the extension
   */
  components?: BrowserExtensionComponents;
  
  /**
   * Options for each component
   */
  componentOptions?: {
    background?: BrowserExtensionComponentOptions;
    contentScripts?: BrowserExtensionComponentOptions;
    [key: string]: BrowserExtensionComponentOptions | undefined;
  };
  
  /**
   * Options for the webpack-extension-reloader
   */
  extensionReloaderOptions?: ExtensionReloaderOptions;
  
  /**
   * Properties to sync from package.json to manifest.json
   */
  manifestSync?: (keyof BrowserExtensionManifestSync)[];
  
  /**
   * Transform the manifest before writing
   */
  manifestTransformer?: BrowserExtensionManifestTransformer;
  
  /**
   * Modes that should be zipped
   * @deprecated Use NODE_ENV instead
   */
  modesToZip?: string[];
}

declare module '@vue/cli-service/types' {
  interface VueUsePluginOptions {
    browserExtension?: BrowserExtensionOptions;
  }
}

/**
 * Vue CLI Plugin for Browser Extension Development
 * 
 * This plugin adds webpack configuration for building browser extensions
 * with Vue.js
 * 
 * @param api - Vue CLI Plugin API
 * @param options - Plugin options
 */
export default function (api: PluginAPI, options: BrowserExtensionOptions): void;
