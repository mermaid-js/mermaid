import type { Node, RectOptions, ShapeRenderOptions } from '../../types.js';
import type { D3Selection } from '../../../types.js';
import { drawRect } from './drawRect.js';

export async function roundedRect<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { themeVariables } }: ShapeRenderOptions
) {
  const radius = themeVariables?.radius ?? 5;

  const options = {
    rx: radius,
    ry: radius,
    classes: '',
    labelPaddingX: (node?.padding ?? 0) * 1,
    labelPaddingY: (node?.padding ?? 0) * 1,
  } as RectOptions;

  return drawRect(parent, node, options);
}
