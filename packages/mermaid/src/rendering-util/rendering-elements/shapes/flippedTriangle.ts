import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.ts';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { createPathFromPoints } from './util.js';

const MIN_HEIGHT = 10;
const MIN_WIDTH = 10;
export const flippedTriangle = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 2 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1 : nodePadding;
  if (node.width || node.height) {
    node.height = node?.height ?? 0;
    if (node.height < MIN_HEIGHT) {
      node.height = MIN_HEIGHT;
    }

    node.width = (node?.width ?? 0) - labelPaddingX - labelPaddingX / 2;
    if (node.width < MIN_WIDTH) {
      node.width = MIN_WIDTH;
    }
  }
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const w = (node?.width ? node?.width : bbox.width) + (labelPaddingX ?? 0);
  const h = node?.height ? node?.height : w + bbox.height;

  const tw = h;

  const points = [
    { x: 0, y: -h },
    { x: tw, y: -h },
    { x: tw / 2, y: 0 },
  ];

  const { cssStyles } = node;

  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});
  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }
  const pathData = createPathFromPoints(points);
  const roughNode = rc.path(pathData, options);

  const flippedTriangle = shapeSvg
    .insert(() => roughNode, ':first-child')
    .attr('transform', `translate(${-h / 2}, ${h / 2})`);

  if (cssStyles && node.look !== 'handDrawn') {
    flippedTriangle.selectChildren('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    flippedTriangle.selectChildren('path').attr('style', nodeStyles);
  }

  node.width = w;
  node.height = h;

  updateNodeBounds(node, flippedTriangle);

  label.attr(
    'transform',
    `translate(${-bbox.width / 2 - (bbox.x - (bbox.left ?? 0))}, ${-h / 2 + (labelPaddingY ?? 0) / 2 + (bbox.y - (bbox.top ?? 0))})`
  );

  node.intersect = function (point) {
    log.info('Triangle intersect', node, points, point);
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};
