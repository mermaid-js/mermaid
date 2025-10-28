import type { ExtendedIconifyIcon, IconifyIcon, IconifyJSON } from '@iconify/types';
import type { IconifyIconCustomisations } from '@iconify/utils';
import { getIconData, iconToHTML, iconToSVG, replaceIDs, stringToIcon } from '@iconify/utils';
import { getConfig } from '../config.js';
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

// Export the singleton instance methods for backward compatibility
export const registerIconPacks = (iconLoaders: IconLoader[]) =>
  globalIconManager.registerIconPacks(iconLoaders);
export const isIconAvailable = async (iconName: string) => {
  return await globalIconManager.isIconAvailable(iconName);
};

export const getIconSVG = async (
  iconName: string,
  customisations?: IconifyIconCustomisations & { fallbackPrefix?: string },
  extraAttributes?: Record<string, string>
) => {
  return await globalIconManager.getIconSVG(iconName, customisations, extraAttributes);
};
