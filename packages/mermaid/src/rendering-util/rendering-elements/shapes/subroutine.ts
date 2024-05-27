import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import { userNodeOverrides } from '$root/rendering-util/rendering-elements/shapes/handdrawnStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';

export const createSubroutinePathD = (
  x: number,
  y: number,
  width: number,
  height: number
): string => {
  const offset = 8;
  return [
    `M${x - offset},${y}`,
    `H${x + width + offset}`,
    `V${y + height}`,
    `H${x - offset}`,
    `V${y}`,
    'M',
    x,
    y,
    'H',
    x + width,
    'V',
    y + height,
    'H',
    x,
    'Z',
  ].join(' ');
};

export const subroutine = async (parent: SVGAElement, node: Node) => {
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node), true);
  const halfPadding = (node?.padding || 0) / 2;
  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const x = -bbox.width / 2 - halfPadding;
  const y = -bbox.height / 2 - halfPadding;
  let rect;
  const { cssStyles, useRough } = node;
  const points = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: 0, y: -h },
    { x: 0, y: 0 },
    { x: -8, y: 0 },
    { x: w + 8, y: 0 },
    { x: w + 8, y: -h },
    { x: -8, y: -h },
    { x: -8, y: 0 },
  ];

  if (useRough) {
    // @ts-ignore
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createSubroutinePathD(-w / 2, -h / 2, w, h);

    const roughNode = rc.rectangle(x - 8, y, w + 16, h, options);
    const l1 = rc.line(x, y, x, y + h, options);
    const l2 = rc.line(x + w, y, x + w, y + h, options);

    shapeSvg.insert(() => l1, ':first-child');
    shapeSvg.insert(() => l2, ':first-child');
    rect = shapeSvg.insert(() => roughNode, ':first-child');

    rect.attr('class', 'basic label-container').attr('style', cssStyles);
  } else {
    const el = insertPolygonShape(shapeSvg, w, h, points);
    if (cssStyles) {
      el.attr('style', cssStyles);
    }
    updateNodeBounds(node, el);
  }

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

export default subroutine;
