import { evaluate } from '../../../config.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import type { D3Selection } from '../../../types.js';
import { getIconSVG, isIconAvailable } from '../../icons.js';
import type { Node } from '../../types.js';

const FONT_AWESOME_ICON = /^(fa[bdklrs]?):([\w-]+)$/;

/**
 * Fills `iconElem` with the node's icon, `iconSize` square.
 *
 * A Font Awesome name that no registered pack provides is drawn as the `<i>` glyph that
 * the page's Font Awesome CSS styles, the way text labels already fall back. That needs
 * HTML labels; without them the icon is the unknown-icon placeholder.
 */
export async function setIconContent<T extends SVGGElement>(
  iconElem: D3Selection<T>,
  node: Node,
  iconSize: number
): Promise<void> {
  const iconName = node.icon ?? '';
  const fontAwesome = FONT_AWESOME_ICON.exec(iconName);
  const useHtmlLabels = node.useHtmlLabels === true || evaluate(getConfig()?.htmlLabels);

  if (fontAwesome && useHtmlLabels && !(await isIconAvailable(iconName))) {
    const [, prefix, name] = fontAwesome;
    iconElem
      .append('foreignObject')
      .attr('width', iconSize)
      .attr('height', iconSize)
      .append('xhtml:div')
      .attr(
        'style',
        `display: flex; align-items: center; justify-content: center; width: ${iconSize}px; height: ${iconSize}px; font-size: ${iconSize}px; line-height: 1;`
      )
      .append('xhtml:i')
      .attr('class', `${prefix} fa-${name}`);
    return;
  }

  iconElem.html(
    `<g>${await getIconSVG(iconName, {
      height: iconSize,
      width: iconSize,
      fallbackPrefix: '',
    })}</g>`
  );
}
