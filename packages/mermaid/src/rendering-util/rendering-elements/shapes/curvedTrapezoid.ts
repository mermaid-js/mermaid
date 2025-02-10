import {
  labelHelper,
  updateNodeBounds,
  getNodeClasses,
  createPathFromPoints,
  generateCirclePoints,
} from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

const getTrapezoidPoints = (rw: number, tw: number, totalHeight: number, radius: number) => [
  { x: rw, y: 0 },
  { x: tw, y: 0 },
  { x: 0, y: totalHeight / 2 },
  { x: tw, y: totalHeight },
  { x: rw, y: totalHeight },
  ...generateCirclePoints(-rw, -totalHeight / 2, radius, 50, 270, 90),
];

export async function curvedTrapezoid<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? 16 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? 12 : nodePadding;
  const minWidth = 20,
    minHeight = 5;
  if (node.width || node.height) {
    node.width = (node?.width ?? 0) - labelPaddingX * 2 * 1.25;
    if (node.width < minWidth) {
      node.width = minWidth;
    }

    node.height = (node?.height ?? 0) - labelPaddingY * 2;
    if (node.height < minHeight) {
      node.height = minHeight;
    }
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const w =
    (node?.width ? node?.width : Math.max(minWidth, bbox.width)) + (labelPaddingX ?? 0) * 2 * 1.25;
  const h =
    (node?.height ? node?.height : Math.max(minHeight, bbox.height)) + (labelPaddingY ?? 0) * 2;
  const radius = h / 2;

  const { cssStyles } = node;
  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const totalWidth = w,
    totalHeight = h;
  const rw = totalWidth - radius;
  const tw = totalHeight / 4;

  const points = getTrapezoidPoints(rw, tw, totalHeight, radius);

  const pathData = createPathFromPoints(points);
  const shapeNode = rc.path(pathData, options);

  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container outer-path');

  if (cssStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', nodeStyles);
  }

  polygon.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, polygon);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    const w = bounds.width;
    const h = bounds.height;
    const radius = h / 2;

    const totalWidth = w,
      totalHeight = h;
    const rw = totalWidth - radius;
    const tw = totalHeight / 4;
    const points = getTrapezoidPoints(rw, tw, totalHeight, radius);

    return intersect.polygon(bounds, points, point);
  };

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
}
