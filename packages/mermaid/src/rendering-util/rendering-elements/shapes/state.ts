import type { Node, RectOptions } from '../../types.js';
import { drawRect } from './drawRect.js';

export const state = async (parent: SVGAElement, node: Node) => {
  const options = {
    rx: node.look === 'neo' ? 3 : 5,
    ry: node.look === 'neo' ? 3 : 5,
    classes: 'flowchart-node',
  } as RectOptions;
  return drawRect(parent, node, options);
};
