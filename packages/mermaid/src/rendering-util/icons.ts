import { log } from '$root/logger.js';
import type { IconifyJSON } from '@iconify/types';
import type { IconifyIconCustomisations } from '@iconify/utils';
import { getIconData, iconToHTML, iconToSVG, replaceIDs, stringToIcon } from '@iconify/utils';

export const iconsStore = new Map<string, IconifyJSON>();

export const registerIconPacks = (...iconPacks: IconifyJSON[]) => {
  for (const pack of iconPacks) {
    iconsStore.set(pack.prefix, pack);
  }
};

export const getIconSVG = (iconName: string, customisations?: IconifyIconCustomisations) => {
  try {
    const data = stringToIcon(iconName, true, true);
    if (!data) {
      throw new Error(`Invalid icon name: ${iconName}`);
    }
    const icons = iconsStore.get(data.prefix || 'default');
    if (!icons) {
      throw new Error(`Icon set not found: ${data.prefix}`);
    }
    const iconData = getIconData(icons, data.name);
    if (!iconData) {
      throw new Error(`Icon not found: ${iconName}`);
    }
    const renderData = iconToSVG(iconData, customisations);
    const svg = iconToHTML(replaceIDs(renderData.body), renderData.attributes);
    return svg;
  } catch (e) {
    log.error(e);
    // Return unknown icon svg.
    return '<g><rect width="80" height="80" style="fill: #087ebf; stroke-width: 0px;"/><text transform="translate(21.16 64.67)" style="fill: #fff; font-family: ArialMT, Arial; font-size: 67.75px;"><tspan x="0" y="0">?</tspan></text></g>';
  }
};
