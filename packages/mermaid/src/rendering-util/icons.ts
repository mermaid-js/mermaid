import type { ExtendedIconifyIcon, IconifyIcon, IconifyJSON } from '@iconify/types';
import type { IconifyIconCustomisations } from '@iconify/utils';
import { getIconData, iconToHTML, iconToSVG, replaceIDs, stringToIcon } from '@iconify/utils';
import { defaultConfig, getConfig } from '../config.js';
import type { MermaidConfig } from '../config.type.js';
import { sanitizeText } from '../diagrams/common/common.js';
import { log } from '../logger.js';

interface AsyncIconLoader {
  name: string;
  loader: () => Promise<IconifyJSON>;
}

interface SyncIconLoader {
  name: string;
  icons: IconifyJSON;
}

export type IconLoader = AsyncIconLoader | SyncIconLoader;

export const unknownIcon: IconifyIcon = {
  body: '<g><rect width="80" height="80" style="fill: #087ebf; stroke-width: 0px;"/><text transform="translate(21.16 64.67)" style="fill: #fff; font-family: ArialMT, Arial; font-size: 67.75px;"><tspan x="0" y="0">?</tspan></text></g>',
  height: 80,
  width: 80,
};

class IconManager {
  private iconsStore = new Map<string, IconifyJSON>();
  private loaderStore = new Map<string, AsyncIconLoader['loader']>();

  registerIconPacks(iconLoaders: IconLoader[]): void {
    for (const iconLoader of iconLoaders) {
      if (!iconLoader.name) {
        throw new Error(
          'Invalid icon loader. Must have a "name" property with non-empty string value.'
        );
      }
      log.debug('Registering icon pack:', iconLoader.name);
      if ('loader' in iconLoader) {
        this.loaderStore.set(iconLoader.name, iconLoader.loader);
      } else if ('icons' in iconLoader) {
        this.iconsStore.set(iconLoader.name, iconLoader.icons);
      } else {
        log.error('Invalid icon loader:', iconLoader);
        throw new Error('Invalid icon loader. Must have either "icons" or "loader" property.');
      }
    }
  }

  clear(): void {
    this.iconsStore.clear();
    this.loaderStore.clear();
  }

  private async getRegisteredIconData(
    iconName: string,
    fallbackPrefix?: string
  ): Promise<ExtendedIconifyIcon> {
    const data = stringToIcon(iconName, true, fallbackPrefix !== undefined);
    if (!data) {
      throw new Error(`Invalid icon name: ${iconName}`);
    }
    const prefix = data.prefix || fallbackPrefix;
    if (!prefix) {
      throw new Error(`Icon name must contain a prefix: ${iconName}`);
    }
    let icons = this.iconsStore.get(prefix);
    if (!icons) {
      const loader = this.loaderStore.get(prefix);
      if (!loader) {
        throw new Error(`Icon set not found: ${data.prefix}`);
      }
      try {
        const loaded = await loader();
        icons = { ...loaded, prefix };
        this.iconsStore.set(prefix, icons);
      } catch (e) {
        log.error(e);
        throw new Error(`Failed to load icon set: ${data.prefix}`);
      }
    }
    const iconData = getIconData(icons, data.name);
    if (!iconData) {
      throw new Error(`Icon not found: ${iconName}`);
    }
    return iconData;
  }

  async isIconAvailable(iconName: string): Promise<boolean> {
    try {
      await this.getRegisteredIconData(iconName);
      return true;
    } catch {
      return false;
    }
  }

  async getIconSVG(
    iconName: string,
    customisations?: IconifyIconCustomisations & { fallbackPrefix?: string },
    extraAttributes?: Record<string, string>
  ): Promise<string> {
    let iconData: ExtendedIconifyIcon;
    try {
      iconData = await this.getRegisteredIconData(iconName, customisations?.fallbackPrefix);
    } catch (e) {
      log.error(e);
      iconData = unknownIcon;
    }
    const renderData = iconToSVG(iconData, customisations);
    const svg = iconToHTML(replaceIDs(renderData.body), {
      ...renderData.attributes,
      ...extraAttributes,
    });
    return sanitizeText(svg, getConfig());
  }
}

const globalIconManager = new IconManager();
const ephemeralIconManager = new IconManager();

export const registerIconPacks = (iconLoaders: IconLoader[]) =>
  globalIconManager.registerIconPacks(iconLoaders);

export const clearIconPacks = () => {
  globalIconManager.clear();
  ephemeralIconManager.clear();
};

export const isIconAvailable = async (iconName: string) => {
  if (await ephemeralIconManager?.isIconAvailable(iconName)) {
    return true;
  }
  return await globalIconManager.isIconAvailable(iconName);
};

export const getIconSVG = async (
  iconName: string,
  customisations?: IconifyIconCustomisations & { fallbackPrefix?: string },
  extraAttributes?: Record<string, string>
) => {
  if (ephemeralIconManager && (await ephemeralIconManager.isIconAvailable(iconName))) {
    return await ephemeralIconManager.getIconSVG(iconName, customisations, extraAttributes);
  }
  return await globalIconManager.getIconSVG(iconName, customisations, extraAttributes);
};

/**
 * Validates that a package name includes at least a major version specification.
 * @param packageName - The package name to validate (e.g., 'package\@1' or '\@scope/package\@1.0.0')
 * @throws Error if the package name doesn't include a valid version
 */
export function validatePackageVersion(packageName: string): void {
  // Accepts: package@1, @scope/package@1, package@1.2.3, @scope/package@1.2.3
  // Rejects: package, @scope/package, package@, @scope/package@
  const match = /^(?:@[^/]+\/)?[^@]+@\d/.exec(packageName);
  if (!match) {
    throw new Error(
      `Package name '${packageName}' must include at least a major version (e.g., 'package@1' or '@scope/package@1.0.0')`
    );
  }
}

/**
 * Fetches JSON data from a URL with proper error handling, size limits, and timeout
 * @param url - The URL to fetch from
 * @param maxFileSizeMB - Maximum file size in MB (default: 5)
 * @param timeout - Network timeout in milliseconds (default: 5000)
 * @returns Promise that resolves to the parsed JSON data
 * @throws Error with descriptive message for various failure cases
 */
async function fetchIconsJson(
  url: string,
  maxFileSizeMB = 5,
  timeout = 5000
): Promise<IconifyJSON> {
  const controller = new AbortController();
  const timeoutID = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch icons from ${url}: ${response.status} ${response.statusText}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error(`Expected JSON response from ${url}, got: ${contentType ?? 'unknown'}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const sizeMB = parseInt(contentLength, 10) / (1024 * 1024);
      if (sizeMB > maxFileSizeMB) {
        throw new Error(
          `Icon pack size (${sizeMB.toFixed(2)}MB) exceeds limit (${maxFileSizeMB}MB)`
        );
      }
    }

    const data = await response.json();

    // Validate Iconify format
    if (!data.prefix || !data.icons) {
      throw new Error(`Invalid Iconify format: missing 'prefix' or 'icons' field`);
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms while fetching icons from ${url}`);
      }
      throw new TypeError(`Network error while fetching icons from ${url}: ${error.message}`);
    } else if (error instanceof SyntaxError) {
      throw new SyntaxError(`Invalid JSON response from ${url}: ${error.message}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutID);
  }
}

/**
 * Validates that a URL is from an allowed host
 * @param url - The URL to validate
 * @param allowedHosts - Array of allowed hosts
 * @throws Error if the host is not in the allowed list
 */
function validateAllowedHost(url: string, allowedHosts: string[]): void {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Check if the hostname or any parent domain is in the allowed list
    const isAllowed = allowedHosts.some((allowedHost) => {
      return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`);
    });

    if (!isAllowed) {
      throw new Error(
        `Host '${hostname}' is not in the allowed hosts list: ${allowedHosts.join(', ')}`
      );
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    throw error;
  }
}

/**
 * Creates an icon loader based on package spec or URL with security validation
 * @param name - The local pack name
 * @param packageSpec - Package spec (e.g., '\@iconify-json/logos\@1') or HTTPS URL
 * @param config - Icons configuration from MermaidConfig
 * @returns IconLoader instance
 * @throws Error for invalid configurations or security violations
 */
function getIconLoader(
  name: string,
  packageSpec: string,
  config: MermaidConfig['icons']
): IconLoader {
  const isUrl = packageSpec.startsWith('https://');
  const allowedHosts = config?.allowedHosts ?? defaultConfig.icons?.allowedHosts ?? [];
  const cdnTemplate = config?.cdnTemplate ?? defaultConfig.icons?.cdnTemplate ?? '';
  const maxFileSizeMB = config?.maxFileSizeMB ?? defaultConfig.icons?.maxFileSizeMB ?? 0;
  const timeout = config?.timeout ?? defaultConfig.icons?.timeout ?? 0;

  if (isUrl) {
    throw new Error('Direct URLs are not allowed.');
  }

  // Validate package version for package specs
  validatePackageVersion(packageSpec);

  // Build URL using CDN template
  if (!cdnTemplate.includes('${packageSpec}')) {
    throw new Error('CDN template must contain ${packageSpec} placeholder');
  }

  const url = cdnTemplate.replace('${packageSpec}', packageSpec);

  // Validate the generated URL host
  validateAllowedHost(url, allowedHosts);

  return {
    name,
    loader: () => fetchIconsJson(url, maxFileSizeMB, timeout),
  };
}

export function registerDiagramIconPacks(config: MermaidConfig['icons']): void {
  const iconPacks: IconLoader[] = [];
  for (const [name, packageSpec] of Object.entries(config?.packs ?? {})) {
    try {
      const iconPack = getIconLoader(name, packageSpec, config);
      iconPacks.push(iconPack);
    } catch (error) {
      log.error(`Failed to create icon loader for '${name}':`, error);
      throw new Error(
        `Invalid icon pack configuration for '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  ephemeralIconManager.clear();
  if (iconPacks.length > 0) {
    ephemeralIconManager.registerIconPacks(iconPacks);
  }
}
