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
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 3 : (node.padding ?? 0);
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1.5 : (node.padding ?? 0);

  if (node.width || node.height) {
    node.width = (node?.width ?? 10) - labelPaddingX * 2;
    node.height = (node?.height ?? 10) - labelPaddingY * 2;
  }

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = (node?.width ? node?.width : bbox.width) + labelPaddingX * 2;
  const h = (node?.height ? node?.height : bbox.height) + labelPaddingY * 2;

  const x = -w / 2;
  const y = -h / 2;
  const notch = -y / 2;

  const points = [
    { x: x, y },
    { x: x + notch, y: 0 },
    { x: x, y: -y },
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
    `translate(${bbox.x - bbox.width / 2}, ${-(bbox.height / 2) - (bbox.y - (bbox.top ?? 0))})`
  );
  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
