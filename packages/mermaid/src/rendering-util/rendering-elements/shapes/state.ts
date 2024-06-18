import type { Node, RectOptions } from '$root/rendering-util/types.d.ts';
import { drawRect } from './drawRect.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';

export const state = async (parent: SVGAElement, node: Node) => {
  const { look } = getConfig();
  const options = {
    rx: node.look === 'neo' ? 3 : 5,
    ry: node.look === 'neo' ? 3 : 5,
    classes: 'flowchart-node',
  } as RectOptions;
  return drawRect(parent, node, options);
};
