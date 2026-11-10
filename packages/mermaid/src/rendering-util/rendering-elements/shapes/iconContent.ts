import { getEffectiveHtmlLabels } from '../../../config.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import type { D3Selection } from '../../../types.js';
import { getIconSVG, isIconAvailable } from '../../icons.js';
import type { Node } from '../../types.js';

const FONT_AWESOME_ICON = /^(fa[bdklrs]?):([\w-]+)$/;

/**
 * How much a glyph must shrink to fit inside its box, keeping its aspect ratio: 1 when it
 * already fits or when either element has no size yet (nothing laid out, nothing to fit).
 */
const glyphScale = (box: Element, glyph: Element): number => {
  const boxRect = box.getBoundingClientRect();
  const glyphRect = glyph.getBoundingClientRect();
  if (!boxRect.width || !boxRect.height || !glyphRect.width || !glyphRect.height) {
    return 1;
  }
  return Math.min(1, boxRect.width / glyphRect.width, boxRect.height / glyphRect.height);
};

/**
 * Shrinks the box's font size so the glyph fits `iconSize` in both directions; a glyph that
 * already fits keeps `iconSize`. Waits for web fonts the page is still loading, because the
 * glyph's width is only known once its font has arrived.
 */
async function fitGlyph(
  box: HTMLElement | null,
  glyph: HTMLElement | null,
  iconSize: number
): Promise<void> {
  if (!box || !glyph) {
    return;
  }
  let scale = glyphScale(box, glyph);
  const fonts = glyph.ownerDocument.fonts;
  if (fonts?.status === 'loading') {
    await fonts.ready;
    scale = glyphScale(box, glyph);
  }
  if (scale < 1) {
    box.style.fontSize = `${iconSize * scale}px`;
  }
}

/**
 * Fills `iconElem` with the node's icon, `iconSize` square.
 *
 * A Font Awesome name that no registered pack provides is drawn as the `<i>` glyph that
 * the page's Font Awesome CSS styles, the way text labels already fall back, and scaled
 * down when it is wider or taller than `iconSize`. That needs HTML labels; without them
 * the icon is the unknown-icon placeholder.
 */
export async function setIconContent<T extends SVGGElement>(
  iconElem: D3Selection<T>,
  node: Node,
  iconSize: number
): Promise<void> {
  const iconName = node.icon ?? '';
  const fontAwesome = FONT_AWESOME_ICON.exec(iconName);
  const useHtmlLabels = node.useHtmlLabels === true || getEffectiveHtmlLabels(getConfig());

  if (fontAwesome && useHtmlLabels && !(await isIconAvailable(iconName))) {
    const [, prefix, name] = fontAwesome;
    const box = iconElem
      .append('foreignObject')
      .attr('width', iconSize)
      .attr('height', iconSize)
      .append<HTMLDivElement>('xhtml:div')
      .attr(
        'style',
        `display: flex; align-items: center; justify-content: center; width: ${iconSize}px; height: ${iconSize}px; font-size: ${iconSize}px; line-height: 1;`
      );
    const glyph = box.append<HTMLElement>('xhtml:i').attr('class', `${prefix} fa-${name}`);
    await fitGlyph(box.node(), glyph.node(), iconSize);
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
