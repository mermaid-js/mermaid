import type { Node, RectOptions } from '../../types.js';
import type { D3Selection } from '../../../types.js';
import { drawRect } from './drawRect.js';

export async function datastore<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { cssClasses, labelPaddingX, labelPaddingY, padding, width, height } = node;

  const options: RectOptions = {
    rx: 0,
    ry: 0,
    classes: cssClasses ?? '',
    labelPaddingX: labelPaddingX ?? (padding ?? 0) * 2,
    labelPaddingY: labelPaddingY ?? padding ?? 0,
  };

  const rect = await drawRect(parent, node, options);
  const datastoreShape = rect.select('.basic.label-container');
  const datastoreWidth = (Number(datastoreShape.attr('width')) || width) ?? 0;
  const datastoreHeight = (Number(datastoreShape.attr('height')) || height) ?? 0;

  if (datastoreWidth > 0 && datastoreHeight > 0) {
    datastoreShape.attr(
      'stroke-dasharray',
      [datastoreWidth, 0, 0, datastoreHeight, datastoreWidth, 0, 0, datastoreHeight].join(' ')
    );
  }

  return rect;
}
