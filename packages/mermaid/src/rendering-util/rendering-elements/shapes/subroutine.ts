import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
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
  const { themeVariables, handdrawnSeed } = getConfig();
  const { nodeBorder, mainBkg } = themeVariables;

  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    'node ' + node.cssClasses, // + ' ' + node.class,
    true
  );

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;

  let rect;
  const { cssStyles, useRough } = node;
  if (useRough) {
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {
      roughness: 0.7,
      fill: mainBkg,
      fillStyle: 'hachure',
      fillWeight: 1.5,
      stroke: nodeBorder,
      seed: handdrawnSeed,
      strokeWidth: 1,
    });
    const pathData = createSubroutinePathD(-w / 2, -h / 2, w, h);
    const roughNode = rc.path(pathData, options);

    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect.attr('class', 'basic label-container').attr('style', cssStyles);
  }

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

  const el = insertPolygonShape(shapeSvg, w, h, points);
  if (cssStyles) {
    el.attr('style', cssStyles);
  }

  updateNodeBounds(node, el);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

export default subroutine;
