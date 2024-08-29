import { log } from '$root/logger.js';
import type { ExtendedIconifyIcon, IconifyIcon, IconifyJSON } from '@iconify/types';
import type { IconifyIconCustomisations } from '@iconify/utils';
import { getIconData, iconToHTML, iconToSVG, replaceIDs, stringToIcon } from '@iconify/utils';

export const unknownIcon: IconifyIcon = {
  body: '<g><rect width="80" height="80" style="fill: #087ebf; stroke-width: 0px;"/><text transform="translate(21.16 64.67)" style="fill: #fff; font-family: ArialMT, Arial; font-size: 67.75px;"><tspan x="0" y="0">?</tspan></text></g>',
  height: 80,
  width: 80,
};

export const iconsStore = new Map<string, IconifyJSON>();

export const registerIconPacks = (...iconPacks: IconifyJSON[]) => {
  for (const pack of iconPacks) {
    iconsStore.set(pack.prefix, pack);
  }
};

const getRegisteredIconData = (iconName: string, fallbackPrefix?: string) => {
  const data = stringToIcon(iconName, true, fallbackPrefix !== undefined);
  if (!data) {
    throw new Error(`Invalid icon name: ${iconName}`);
  }
  const prefix = data.prefix || fallbackPrefix;
  if (!prefix) {
    throw new Error(`Icon name must contain a prefix: ${iconName}`);
  }
  const icons = iconsStore.get(prefix);
  if (!icons) {
    throw new Error(`Icon set not found: ${data.prefix}`);
  }
  const iconData = getIconData(icons, data.name);
  if (!iconData) {
    throw new Error(`Icon not found: ${iconName}`);
  }
  return iconData;
};

export const isIconAvailable = (iconName: string) => {
  try {
    getRegisteredIconData(iconName);
    return true;
  } catch {
    return false;
  }
};

export const getIconSVG = (
  iconName: string,
  customisations?: IconifyIconCustomisations & { fallbackPrefix?: string }
) => {
  let iconData: ExtendedIconifyIcon;
  try {
    iconData = getRegisteredIconData(iconName, customisations?.fallbackPrefix);
  } catch (e) {
    log.error(e);
    iconData = unknownIcon;
  }
  const renderData = iconToSVG(iconData, customisations);
  const svg = iconToHTML(replaceIDs(renderData.body), renderData.attributes);
  return svg;
};
