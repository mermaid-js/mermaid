import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

export const rect_left_inv_arrow = async (
  parent: SVGAElement,
  node: Node
): Promise<SVGAElement> => {
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
  // @ts-ignore - rough is not typed
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
    `translate(${-w / 2 + -notch / 2 + (node.padding ?? 0) / 2 - (bbox.x - (bbox.left ?? 0))},${-h / 2 + (node.padding ?? 0) / 2 - (bbox.y - (bbox.top ?? 0))})`
  );
  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
