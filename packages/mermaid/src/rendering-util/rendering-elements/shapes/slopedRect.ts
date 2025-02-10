import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

export async function slopedRect<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? 16 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? 12 : nodePadding;

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.width = Math.max((node?.width ?? 0) - labelPaddingX * 2, 10);
    node.height = Math.max((node?.height ?? 0) / 1.5 - labelPaddingY * 2, 10);
  }

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = (node?.width ? node?.width : bbox.width) + labelPaddingX * 2;
  const totalHeight = ((node?.height ? node?.height : bbox.height) + labelPaddingY * 2) * 1.5;

  const w = totalWidth;
  const h = totalHeight / 1.5;
  const x = -w / 2;
  const y = -h / 2;

  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const points = [
    { x, y },
    { x, y: y + h },
    { x: x + w, y: y + h },
    { x: x + w, y: y - h / 2 },
  ];

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

  polygon.attr('transform', `translate(0, ${h / 4})`);
  label.attr(
    'transform',
    `translate(${-w / 2 + (labelPaddingX ?? 0) - (bbox.x - (bbox.left ?? 0))}, ${-h / 4 + (labelPaddingY ?? 0) - (bbox.y - (bbox.top ?? 0))})`
  );

  updateNodeBounds(node, polygon);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    // TODO: Implement intersect for this shape
    const radius = bounds.width / 2;
    return intersect.circle(bounds, radius, point);
  };

  node.intersect = function (point) {
    const pos = intersect.polygon(node, points, point);
    return pos;
  };

  return shapeSvg;
}
