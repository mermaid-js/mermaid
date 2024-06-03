import type { Node, RectOptions } from '$root/rendering-util/types.d.ts';
import { drawRect } from './drawRect.js';

export const roundedRect = async (parent: SVGAElement, node: Node) => {
  node.look = 'neo';
  const options = {
    rx: node.look === 'neo' ? 1 : 1,
    ry: node.look === 'neo' ? 1 : 1,
    labelPaddingX: node.padding * 2,
    labelPaddingY: node.padding * 1,
    classes: '',
  } as RectOptions;

  return drawRect(parent, node, options);
};
