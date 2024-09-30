import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { createRoundedRectPathD } from './roundedRectPath.js';

export const createStadiumPathD = (
  x: number,
  y: number,
  totalWidth: number,
  totalHeight: number
) => {
  const radius = totalHeight / 2;
  return [
    'M',
    x + radius,
    y, // Move to the start of the top-left arc
    'H',
    x + totalWidth - radius, // Draw horizontal line to the start of the top-right arc
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x + totalWidth,
    y + radius, // Draw top-right arc
    'H',
    x, // Draw horizontal line to the start of the bottom-right arc
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x + totalWidth - radius,
    y + totalHeight, // Draw bottom-right arc
    'H',
    x + radius, // Draw horizontal line to the start of the bottom-left arc
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x,
    y + radius, // Draw bottom-left arc
    'Z', // Close the path
  ].join(' ');
};

export const stadium = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const nodePadding = node.padding ?? 0;
  const labelPaddingX = node.look === 'neo' ? nodePadding * 3 : nodePadding;
  const labelPaddingY = node.look === 'neo' ? nodePadding * 1.5 : nodePadding;
  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    node.width = (node?.width ?? 0) - labelPaddingX * 2;
    if (node.width < 20) {
      node.width = 20;
    }

    node.height = (node?.height ?? 0) - labelPaddingY * 2;
    if (node.height < 10) {
      node.height = 10;
    }
  }
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  // const h = Math.max(bbox.height, node?.height || 0) + labelPaddingY;
  // const w = Math.max(bbox.width + h / 4, node?.width || 0, 150) + labelPaddingX;

  const w = Math.max(bbox.width, node?.width || 0) + labelPaddingX * 2;
  const h = Math.max(bbox.height, node?.height || 0) + labelPaddingY * 2;

  let rect;
  const { cssStyles } = node;
  if (node.look === 'handDrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});

    const pathData = createRoundedRectPathD(-w / 2, -h / 2, w, h, h / 2);
    const roughNode = rc.path(pathData, options);

    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect.attr('class', 'basic label-container').attr('style', cssStyles);
  } else {
    rect = shapeSvg.insert('rect', ':first-child');

    rect
      .attr('class', 'basic label-container')
      .attr('style', nodeStyles)
      .attr('rx', h / 2)
      .attr('ry', h / 2)
      .attr('x', -w / 2)
      .attr('y', -h / 2)
      .attr('width', w)
      .attr('height', h);
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};
