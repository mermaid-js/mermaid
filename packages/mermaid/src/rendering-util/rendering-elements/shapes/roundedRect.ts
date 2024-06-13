import type { Node, RectOptions } from '$root/rendering-util/types.d.ts';
import { drawRect } from './drawRect.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';

export const roundedRect = async (parent: SVGAElement, node: Node) => {
  const { look } = getConfig();
  node.look = look;
  const options = {
    rx: node.look === 'neo' ? 3 : 5,
    ry: node.look === 'neo' ? 3 : 5,

    labelPaddingX: node.look === 'neo' ? node.padding * 2 : node.padding,
    labelPaddingY: node.look === 'neo' ? node.padding : node.padding,
    classes: '',
    labelPaddingX: (node?.padding || 0) * 1,
    labelPaddingY: (node?.padding || 0) * 1,
  } as RectOptions;

  return drawRect(parent, node, options);
};
