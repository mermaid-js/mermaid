import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { createPathFromPoints } from './util.js';
import { evaluate } from '../../../diagrams/common/common.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

const MIN_HEIGHT = 10;
const MIN_WIDTH = 10;

export async function triangle<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  if (node.width || node.height) {
    node.width = ((node?.width ?? 0) - labelPaddingX) / 2;
    if (node.width < MIN_WIDTH) {
      node.width = MIN_WIDTH;
    }
    node.height = node?.height ?? 0;
    if (node.height < MIN_HEIGHT) {
      node.height = MIN_HEIGHT;
    }
  }

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const useHtmlLabels = evaluate(getConfig().flowchart?.htmlLabels);
  const w = (node?.width ? node?.width : bbox.width) + labelPaddingX;
  const h = node?.height ? node?.height : w + bbox.height;
  const tw = h;
  const points = [
    { x: 0, y: 0 },
    { x: tw, y: 0 },
    { x: tw / 2, y: -h },
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

  const polygon = shapeSvg
    .insert(() => roughNode, ':first-child')
    .attr('transform', `translate(${-h / 2}, ${h / 2})`)
    .attr('class', 'outer-path');

  if (cssStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    polygon.selectChildren('path').attr('style', nodeStyles);
  }

  node.width = w;
  node.height = h;

  updateNodeBounds(node, polygon);

  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))}, ${h / 2 - (bbox.height + (node.padding ?? 0) / (useHtmlLabels ? 2 : 1) - (bbox.y - (bbox.top ?? 0)))})`
  );

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    // TODO: Implement intersect for this shape
    const radius = bounds.width / 2;
    return intersect.circle(bounds, radius, point);
  };

  node.intersect = function (point) {
    log.info('Triangle intersect', node, points, point);
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
}
