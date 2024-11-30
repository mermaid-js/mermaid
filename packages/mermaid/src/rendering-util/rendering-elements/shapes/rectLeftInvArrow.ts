import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

export async function rect_left_inv_arrow<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const w = Math.max(bbox.width + (node.padding ?? 0), node?.width ?? 0);
  const h = Math.max(bbox.height + (node.padding ?? 0), node?.height ?? 0);

  const x = -w / 2;
  const y = -h / 2;
  const notch = y / 2;

  const points = [
    { x: x + notch, y },
    { x: x, y: 0 },
    { x: x + notch, y: -y },
    { x: -x, y: -y },
    { x: -x, y },
  ];

  const { cssStyles } = node;
  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const pathData = createPathFromPoints(points);
  const roughNode = rc.path(pathData, options);

  const polygon = shapeSvg.insert(() => roughNode, ':first-child');

  polygon.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    polygon.selectAll('path').attr('style', cssStyles);
  }
  if (nodeStyles && node.look !== 'handDrawn') {
    polygon.selectAll('path').attr('style', nodeStyles);
  }

  polygon.attr('transform', `translate(${-notch / 2},0)`);

  label.attr(
    'transform',
    `translate(${-notch / 2 - bbox.width / 2 - (bbox.x - (bbox.left ?? 0))}, ${-(bbox.height / 2) - (bbox.y - (bbox.top ?? 0))})`
  );
  updateNodeBounds(node, polygon);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    // TODO: Implement intersect for this shape
    const radius = bounds.width / 2;
    return intersect.circle(bounds, radius, point);
  };

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
}
