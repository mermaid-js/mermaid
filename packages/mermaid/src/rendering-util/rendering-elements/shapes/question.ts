import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

export const createDecisionBoxPathD = (x: number, y: number, size: number): string => {
  return [
    `M${x + size / 2},${y}`,
    `L${x + size},${y - size / 2}`,
    `L${x + size / 2},${y - size}`,
    `L${x},${y - size / 2}`,
    'Z',
  ].join(' ');
};

export async function question<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const w = bbox.width + (node.padding ?? 0);
  const h = bbox.height + (node.padding ?? 0);
  const s = w + h;
  const adjustment = 0.5;

  const points = [
    { x: s / 2, y: 0 },
    { x: s, y: -s / 2 },
    { x: s / 2, y: -s },
    { x: 0, y: -s / 2 },
  ];

  let polygon: typeof shapeSvg | ReturnType<typeof insertPolygonShape>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createDecisionBoxPathD(0, 0, s);
    const roughNode = rc.path(pathData, options);

    polygon = shapeSvg
      .insert(() => roughNode, ':first-child')
      .attr('transform', `translate(${-s / 2 + adjustment}, ${s / 2})`);

    if (cssStyles) {
      polygon.attr('style', cssStyles);
    }
  } else {
    polygon = insertPolygonShape(shapeSvg, s, s, points);
    polygon.attr('transform', `translate(${-s / 2 + adjustment}, ${s / 2})`);
  }

  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  updateNodeBounds(node, polygon);
  node.calcIntersect = function (bounds: Bounds, point: Point) {
    const s = bounds.width;

    // Define polygon points
    const points = [
      { x: s / 2, y: 0 },
      { x: s, y: -s / 2 },
      { x: s / 2, y: -s },
      { x: 0, y: -s / 2 },
    ];

    // Calculate the intersection point.
    //
    // This used to return `res` shifted by -0.5 on both axes, compensating for
    // a half-unit displacement that `intersectLine` applied to every result —
    // leftover integer-rounding arithmetic from the Graphics Gems original. The
    // displacement is gone, so the compensation has to go with it or the
    // diamond's attachment moves half a pixel the other way.
    return intersect.polygon(bounds, points, point);
  };

  node.intersect = function (point) {
    // @ts-ignore TODO fix this (KNSV)
    return this.calcIntersect(node as Bounds, point);
  };

  return shapeSvg;
}
