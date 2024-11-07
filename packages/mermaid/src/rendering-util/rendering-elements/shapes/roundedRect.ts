import type { Node, RectOptions } from '../../types.js';
import type { D3Selection } from '../../../types.js';
import { drawRect } from './drawRect.js';

export async function roundedRect<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const nodePadding = node.padding ?? 0;
  const options = {
    rx: node.look === 'neo' ? 3 : 5,
    ry: node.look === 'neo' ? 3 : 5,

    labelPaddingX: node.look === 'neo' ? nodePadding * 2 : nodePadding,
    labelPaddingY: node.look === 'neo' ? nodePadding : nodePadding,
    classes: '',
  } as RectOptions;

  return drawRect(parent, node, options);
}
