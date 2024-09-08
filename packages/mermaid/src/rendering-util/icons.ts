import { log } from '../logger.js';
import type { ExtendedIconifyIcon, IconifyIcon, IconifyJSON } from '@iconify/types';
import type { IconifyIconCustomisations } from '@iconify/utils';
import { getIconData, iconToHTML, iconToSVG, replaceIDs, stringToIcon } from '@iconify/utils';

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

const iconsStore = new Map<string, IconifyJSON>();
const loaderStore = new Map<string, AsyncIconLoader['loader']>();

export const registerIconPacks = (iconLoaders: IconLoader[]) => {
  for (const iconLoader of iconLoaders) {
    if (!iconLoader.name) {
      throw new Error(
        'Invalid icon loader. Must have a "name" property with non-empty string value.'
      );
    }
    log.debug('Registering icon pack:', iconLoader.name);
    if ('loader' in iconLoader) {
      loaderStore.set(iconLoader.name, iconLoader.loader);
    } else if ('icons' in iconLoader) {
      iconsStore.set(iconLoader.name, iconLoader.icons);
    } else {
      log.error('Invalid icon loader:', iconLoader);
      throw new Error('Invalid icon loader. Must have either "icons" or "loader" property.');
    }
  }
};

const getRegisteredIconData = async (iconName: string, fallbackPrefix?: string) => {
  const data = stringToIcon(iconName, true, fallbackPrefix !== undefined);
  if (!data) {
    throw new Error(`Invalid icon name: ${iconName}`);
  }
  const prefix = data.prefix || fallbackPrefix;
  if (!prefix) {
    throw new Error(`Icon name must contain a prefix: ${iconName}`);
  }
  let icons = iconsStore.get(prefix);
  if (!icons) {
    const loader = loaderStore.get(prefix);
    if (!loader) {
      throw new Error(`Icon set not found: ${data.prefix}`);
    }
    try {
      const loaded = await loader();
      icons = { ...loaded, prefix };
      iconsStore.set(prefix, icons);
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
};

export const isIconAvailable = async (iconName: string) => {
  try {
    await getRegisteredIconData(iconName);
    return true;
  } catch {
    return false;
  }
};

export const getIconSVG = async (
  iconName: string,
  customisations?: IconifyIconCustomisations & { fallbackPrefix?: string }
) => {
  let iconData: ExtendedIconifyIcon;
  try {
    iconData = await getRegisteredIconData(iconName, customisations?.fallbackPrefix);
  } catch (e) {
    log.error(e);
    iconData = unknownIcon;
  }
  const renderData = iconToSVG(iconData, customisations);
  const svg = iconToHTML(replaceIDs(renderData.body), renderData.attributes);
  return svg;
};
