import type { Node, RectOptions } from '../../types.js';
import { drawRect } from './drawRect.js';

export const squareRect = async (parent: SVGAElement, node: Node) => {
  const options = {
    rx: 0,
    ry: 0,
    classes: '',
    labelPaddingX: (node?.padding || 0) * 2,
    labelPaddingY: (node?.padding || 0) * 1,
  } as RectOptions;
  return drawRect(parent, node, options);
};
