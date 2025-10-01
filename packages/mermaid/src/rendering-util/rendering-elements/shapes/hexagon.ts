import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';
import rough from 'roughjs';

export const createHexagonPathD = (
  x: number,
  y: number,
  width: number,
  height: number,
  m: number
): string => {
  return [
    `M${x + m},${y}`,
    `L${x + width - m},${y}`,
    `L${x + width},${y - height / 2}`,
    `L${x + width - m},${y - height}`,
    `L${x + m},${y - height}`,
    `L${x},${y - height / 2}`,
    'Z',
  ].join(' ');
};

export async function hexagon<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const ICON_SIZE = 30;
  const ICON_PADDING = 1;
  let h = bbox.height + (node.padding ?? 0);
  let w = bbox.width + (node.padding ?? 0) * 2.5;

  let labelXOffset = -bbox.width / 2;
  if (node.icon) {
    const minWidthWithIcon = bbox.width + ICON_SIZE + ICON_PADDING * 2 + (node.padding ?? 0) * 2.5;
    w = Math.max(w, minWidthWithIcon);
    h = Math.max(h, ICON_SIZE + (node.padding ?? 0));

    node.width = w;
    node.height = h;

    const availableTextSpace = w - ICON_SIZE - ICON_PADDING * 2;
    labelXOffset = -w / 2 + ICON_SIZE + ICON_PADDING + availableTextSpace / 2 - bbox.width / 2;
  } else {
    node.width = w;
    node.height = h;
  }
  const labelYOffset = -bbox.height / 2;
  label.attr('transform', `translate(${labelXOffset}, ${labelYOffset})`);
  const { cssStyles } = node;
  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  let halfWidth = w / 2;
  const m = halfWidth / 6; // Margin for label
  halfWidth = halfWidth + m; // Adjusted half width for hexagon

  const halfHeight = h / 2;

  const fixedLength = halfHeight / 2;
  const deducedWidth = halfWidth - fixedLength;

  const points = [
    { x: -deducedWidth, y: -halfHeight },
    { x: 0, y: -halfHeight },
    { x: deducedWidth, y: -halfHeight },
    { x: halfWidth, y: 0 },
    { x: deducedWidth, y: halfHeight },
    { x: 0, y: halfHeight },
    { x: -deducedWidth, y: halfHeight },
    { x: -halfWidth, y: 0 },
  ];

  const pathData = createPathFromPoints(points);
  const shapeNode = rc.path(pathData, options);

  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container');

  if (cssStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
}
