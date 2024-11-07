import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';
import type { D3Selection } from '../../../types.js';

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
  const f = 4;
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 3 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1.5 : nodePadding;
  if (node.width || node.height) {
    const originalHeight = node.height ?? 0;
    const m = originalHeight / f;
    node.width = (node?.width ?? 0) - 2 * m - labelPaddingY;
    node.height = (node.height ?? 0) - labelPaddingX;
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const h = (node?.height ? node?.height : bbox.height) + labelPaddingX;
  const m = h / f;

  const w = (node?.width ? node?.width : bbox.width) + 2 * m + labelPaddingY;
  const points = [
    { x: m, y: 0 },
    { x: w - m, y: 0 },
    { x: w, y: -h / 2 },
    { x: w - m, y: -h },
    { x: m, y: -h },
    { x: 0, y: -h / 2 },
  ];

  let polygon: D3Selection<SVGGElement> | Awaited<ReturnType<typeof insertPolygonShape>>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const pathData = createHexagonPathD(0, 0, w, h, m);
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

  node.width = w;
  node.height = h;

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
}
