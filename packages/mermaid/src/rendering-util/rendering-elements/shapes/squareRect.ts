import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { stampColorSlot } from '../../../diagrams/common/colorThemeGate.js';
import type { Node, RectOptions } from '../../types.js';
import type { D3Selection } from '../../../types.js';
import { drawRect } from './drawRect.js';

export async function squareRect<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? 16 : nodePadding * 2;
  const labelPaddingY = node.look === 'neo' ? 12 : nodePadding;

  const options = {
    rx: 0,
    ry: 0,
    classes: '',
    labelPaddingX: node.labelPaddingX ?? labelPaddingX,
    labelPaddingY: labelPaddingY,
  } as RectOptions;
  const shapeSvg = await drawRect(parent, node, options);

  // Per-item colour slot, for a use case written with the `[Rect]` form. Unlike the
  // containers `clusters.js` stamps, this shape backs the plain `rect` for the whole library
  // -- notes, JSON tables and `classDb`'s synthetic interface node all reach it -- so stamp
  // only where a diagram actually assigned a slot. Stamping unconditionally would hand all of
  // those `color-0`, inert only for as long as no stylesheet emitting `[data-color-id] ... rect`
  // rules happens to render a bare rect; `er/styles.ts` already emits that selector shape.
  if (node.colorIndex !== undefined) {
    const { theme, themeVariables } = getConfig();
    stampColorSlot(shapeSvg, node.colorIndex, theme, themeVariables.borderColorArray);
  }

  return shapeSvg;
}
