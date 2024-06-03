import type { Node } from '$root/rendering-util/types.d.ts';
import { drawRect } from './drawRect.js';

export const state = async (parent: SVGAElement, node: Node) => {
  node.look = 'neo';

  const options = {
    rx: node.look === 'neo' ? 2 : 5,
    ry: node.look === 'neo' ? 2 : 5,
    classes: 'flowchart-node',
  };
  return drawRect(parent, node, options);
};
