import type { Node, RectOptions } from '$root/rendering-util/types.d.ts';
import { drawRect } from './drawRect.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';

export const roundedRect = async (parent: SVGAElement, node: Node) => {
  const { look } = getConfig();
  node.look = look;
  const options = {
    rx: node.look === 'neo' ? 1 : 5,
    ry: node.look === 'neo' ? 1 : 5,
    labelPaddingX: node.padding * 2,
    labelPaddingY: node.padding * 1,
    classes: '',
  } as RectOptions;

  return drawRect(parent, node, options);
};
