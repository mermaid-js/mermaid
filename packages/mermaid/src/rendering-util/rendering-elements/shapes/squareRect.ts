import type { Node, RectOptions } from '$root/rendering-util/types.d.ts';
import { drawRect } from './drawRect.js';

export const squareRect = async (parent: SVGAElement, node: Node) => {
  const options = {
    rx: 0,
    ry: 0,
    classes: '',
  } as RectOptions;
  return drawRect(parent, node, options);
};
