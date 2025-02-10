import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';
import { createPathFromPoints } from './util.js';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

function getPoints(w: number, h: number, padding: number) {
  const NOTCH_SIZE = 12;
  const left = 0;
  const right = w;
  const top = -h;
  const bottom = 0;

  return [
    { x: left + NOTCH_SIZE, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
    { x: left, y: top + NOTCH_SIZE },
    { x: left + NOTCH_SIZE, y: top },
  ];
}
export async function card<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const h = bbox.height + node.padding;
  const padding = 12;
  const w = bbox.width + node.padding + padding;

  const points = getPoints(w, h, padding);

  let polygon: D3Selection<SVGGElement> | Awaited<ReturnType<typeof insertPolygonShape>>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createPathFromPoints(points);
    const roughNode = rc.path(pathData, options);

    polygon = shapeSvg
      .insert(() => roughNode, ':first-child')
      .attr('transform', `translate(${-w / 2}, ${h / 2})`);

    if (cssStyles) {
      polygon.attr('style', cssStyles);
    }
  } else {
    polygon = insertPolygonShape(shapeSvg, w, h, points);
  }

  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  updateNodeBounds(node, polygon);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    const h = bounds.height;
    const padding = 12;
    const w = bounds.width;

    const points = getPoints(w, h, padding);

    const res = intersect.polygon(bounds, points, point);
    return { x: res.x - 0.5, y: res.y - 0.5 };
  };

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
}
