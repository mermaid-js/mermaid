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

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const s = w + h;

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
      .attr('transform', `translate(${-s / 2}, ${s / 2})`);

    if (cssStyles) {
      polygon.attr('style', cssStyles);
    }
  } else {
    polygon = insertPolygonShape(shapeSvg, s, s, points);
  }

  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  updateNodeBounds(node, polygon);
  node.calcIntersect = function (bounds: Bounds, point: Point) {
    const s = bounds.width;

    // console.log(
    //   'APA10\nbounds width:',
    //   bounds.width,
    //   '\nbounds height:',
    //   bounds.height,
    //   'point:',
    //   point.x,
    //   point.y,
    //   '\nw:',
    //   w,
    //   '\nh',
    //   h,
    //   '\ns',
    //   s
    // );

    // Define polygon points
    const points = [
      { x: s / 2, y: 0 },
      { x: s, y: -s / 2 },
      { x: s / 2, y: -s },
      { x: 0, y: -s / 2 },
    ];

    // Calculate the intersection point
    const res = intersect.polygon(bounds, points, point);

    return { x: res.x - 0.5, y: res.y - 0.5 }; // Adjusted result
  };

  node.intersect = function (point: Point) {
    return this.calcIntersect ? this.calcIntersect(node as Bounds, point) : { x: 0, y: 0 };
  };

  return shapeSvg;
}
