import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { insertPolygonShape } from './insertPolygonShape.js';

export const createDecisionBoxPathD = (x: number, y: number, size: number): string => {
  return [
    `M${x + size / 2},${y}`,
    `L${x + size},${y - size / 2}`,
    `L${x + size / 2},${y - size}`,
    `L${x},${y - size / 2}`,
    'Z',
  ].join(' ');
};

export const question = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const padding = (node.padding ?? 0) * 4;
  if (node.width || node.height) {
    if ((node.width ?? 10) < 10) {
      node.width = 10;
    }
    node.width = (node?.width ?? 0) - padding;

    if ((node.height ?? 10) < 10) {
      node.height = 10;
    }
    node.height = (node?.height ?? 0) - padding;
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const w = ((node?.width ? node?.width : bbox.width) + padding) / 2;
  const h = w;
  const s = w + h;

  const points = [
    { x: s / 2, y: 0 },
    { x: s, y: -s / 2 },
    { x: s / 2, y: -s },
    { x: 0, y: -s / 2 },
  ];

  let polygon: d3.Selection<SVGPolygonElement | SVGGElement, unknown, null, undefined>;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-ignore - rough is not typed
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

  node.intersect = function (point) {
    log.debug(
      'APA12 Intersect called SPLIT\npoint:',
      point,
      '\nnode:\n',
      node,
      '\nres:',
      intersect.polygon(node, points, point)
    );
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
