import rough from 'roughjs';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { evaluate } from '../../../diagrams/common/common.js';
import { log } from '../../../logger.js';
import type { Node } from '../../types.d.ts';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { createPathFromPoints, getNodeClasses, labelHelper, updateNodeBounds } from './util.js';

export const triangle = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const useHtmlLabels = evaluate(getConfig().flowchart?.htmlLabels);

  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const w = Math.max(bbox.width + (labelPaddingX ?? 0), node?.width ?? 0);
  const h = Math.max(w + bbox.height, node?.height ?? 0);

  const tw = w + bbox.height;
  const points = [
    { x: 0, y: 0 },
    { x: tw, y: 0 },
    { x: tw / 2, y: -h },
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

  const polygon = shapeSvg
    .insert(() => roughNode, ':first-child')
    .attr('transform', `translate(${-h / 2}, ${h / 2})`);

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

  node.intersect = function (point) {
    log.info('Triangle intersect', node, points, point);
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
