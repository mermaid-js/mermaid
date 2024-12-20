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
    labelPaddingX,
    labelPaddingY,
  } as RectOptions;
  return drawRect(parent, node, options);
}
