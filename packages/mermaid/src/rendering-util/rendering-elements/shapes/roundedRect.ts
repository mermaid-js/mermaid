import type { Node, RectOptions } from '$root/rendering-util/types.d.ts';
import { drawRect } from './drawRect.js';

export const roundedRect = async (parent: SVGAElement, node: Node) => {
  const options = {
    rx: node.look === 'neo' ? 3 : 5,
    ry: node.look === 'neo' ? 3 : 5,

    labelPaddingX: node.look === 'neo' ? node.padding * 2 : node.padding,
    labelPaddingY: node.look === 'neo' ? node.padding : node.padding,
    classes: '',
  } as RectOptions;

  return drawRect(parent, node, options);
};
