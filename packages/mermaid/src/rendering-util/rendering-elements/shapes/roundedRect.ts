import type { Node, RectOptions } from '../../types.js';
import type { D3Selection } from '../../../types.js';
import { drawRect } from './drawRect.js';

export async function roundedRect<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const options = {
    rx: 5,
    ry: 5,
    classes: '',
    labelPaddingX: (node?.padding || 0) * 1,
    labelPaddingY: (node?.padding || 0) * 1,
  } as RectOptions;

  return drawRect(parent, node, options);
}
