import type { Node, RectOptions } from '../../types.js';
import type { D3Selection } from '../../../types.js';
import { drawRect } from './drawRect.js';
import { getConfig } from '../../../config.js';

export async function roundedRect<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { themeVariables } = getConfig();
  const { radius } = themeVariables;
  const nodePadding = node.padding ?? 0;
  let labelPaddingX = 0;
  let labelPaddingY = 0;
  let rx = 0;
  let ry = 0;

  switch (node.look) {
    case 'neo':
      labelPaddingX = 16;
      labelPaddingY = 12;
      rx = ry = radius;
      break;
    default:
      labelPaddingX = nodePadding;
      labelPaddingY = nodePadding;
      rx = ry = 5;
  }

  const options = {
    rx,
    ry,

    labelPaddingX,
    labelPaddingY,
    classes: '',
  } as RectOptions;

  return drawRect(parent, node, options);
}
