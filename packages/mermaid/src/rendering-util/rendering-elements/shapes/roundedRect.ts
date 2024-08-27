import type { Node, RectOptions } from '$root/rendering-util/types.d.ts';
import { drawRect } from './drawRect.js';

export const roundedRect = async (parent: SVGAElement, node: Node) => {
  const nodePadding = node.padding ?? 0;
  const options = {
    rx: node.look === 'neo' ? 3 : 5,
    ry: node.look === 'neo' ? 3 : 5,

    labelPaddingX: node.look === 'neo' ? nodePadding * 2 : nodePadding,
    labelPaddingY: node.look === 'neo' ? nodePadding : nodePadding,
    classes: '',
  } as RectOptions;

  return drawRect(parent, node, options);
};
