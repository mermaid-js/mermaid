import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import rough from 'roughjs';
import { select } from 'd3';

/**
 *
 * @param rect
 * @param borders
 * @param totalWidth
 * @param totalHeight
 */
function applyNodePropertyBorders(
  rect: d3.Selection<SVGRectElement, unknown, null, undefined>,
  borders: string | undefined,
  totalWidth: number,
  totalHeight: number
) {
  if (!borders) {
    return;
  }
  const strokeDashArray: number[] = [];
  const addBorder = (length: number) => {
    strokeDashArray.push(length, 0);
  };
  const skipBorder = (length: number) => {
    strokeDashArray.push(0, length);
  };
  if (borders.includes('t')) {
    log.debug('add top border');
    addBorder(totalWidth);
  } else {
    skipBorder(totalWidth);
  }
  if (borders.includes('r')) {
    log.debug('add right border');
    addBorder(totalHeight);
  } else {
    skipBorder(totalHeight);
  }
  if (borders.includes('b')) {
    log.debug('add bottom border');
    addBorder(totalWidth);
  } else {
    skipBorder(totalWidth);
  }
  if (borders.includes('l')) {
    log.debug('add left border');
    addBorder(totalHeight);
  } else {
    skipBorder(totalHeight);
  }

  rect.attr('stroke-dasharray', strokeDashArray.join(' '));
}

function createRoundedRectPathD(
  x: number,
  y: number,
  totalWidth: number,
  totalHeight: number,
  radius: number
) {
  return [
    'M',
    x + radius,
    y, // Move to the first point
    'H',
    x + totalWidth - radius, // Draw horizontal line to the beginning of the right corner
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x + totalWidth,
    y + radius, // Draw arc to the right top corner
    'V',
    y + totalHeight - radius, // Draw vertical line down to the beginning of the right bottom corner
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x + totalWidth - radius,
    y + totalHeight, // Draw arc to the right bottom corner
    'H',
    x + radius, // Draw horizontal line to the beginning of the left bottom corner
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x,
    y + totalHeight - radius, // Draw arc to the left bottom corner
    'V',
    y + radius, // Draw vertical line up to the beginning of the left top corner
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x + radius,
    y, // Draw arc to the left top corner
    'Z', // Close the path
  ].join(' ');
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export const rect = async (parent: SVGAElement, node: Node) => {
  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    'node ' + node.classes + ' ' + node.class,
    true
  );

  const useRough = true;

  const totalWidth = bbox.width + node.padding;
  const totalHeight = bbox.height + node.padding;
  const x = -bbox.width / 2 - halfPadding;
  const y = -bbox.height / 2 - halfPadding;

  let rect;
  if (useRough) {
    const rc = rough.svg(shapeSvg);
    let roughNode;
    if (node.rx || node.ry) {
      // add the rect
      roughNode = rc.path(createRoundedRectPathD(x, y, totalWidth, totalHeight, 6));
    } else {
      roughNode = rc.rectangle(x, y, totalWidth, totalHeight, { radius: 60 });
    }
    const svgNode = shapeSvg.node();
    svgNode.insertBefore(roughNode, svgNode.firstChild);
    rect = select(roughNode);
  } else {
    rect = shapeSvg.insert('rect', ':first-child');

    rect
      .attr('class', 'basic label-container')
      .attr('style', node.style)
      .attr('rx', node.rx)
      .attr('ry', node.ry)
      .attr('x', x)
      .attr('y', y)
      .attr('width', totalWidth)
      .attr('height', totalHeight);
  }

  if (node.props) {
    const propKeys = new Set(Object.keys(node.props));
    if (node.props.borders) {
      applyNodePropertyBorders(rect, node.props.borders + '', totalWidth, totalHeight);
      propKeys.delete('borders');
    }
    propKeys.forEach((propKey) => {
      log.warn(`Unknown node property ${propKey}`);
    });
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

export const labelRect = async (parent: SVGElement, node: Node) => {
  const { shapeSvg } = await labelHelper(parent, node, 'label', true);

  log.trace('Classes = ', node.class);
  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  // Hide the rect we are only after the label
  const totalWidth = 0;
  const totalHeight = 0;
  rect.attr('width', totalWidth).attr('height', totalHeight);
  shapeSvg.attr('class', 'label edgeLabel');

  if (node.props) {
    const propKeys = new Set(Object.keys(node.props));
    if (node.props.borders) {
      applyNodePropertyBorders(rect, node.borders, totalWidth, totalHeight);
      propKeys.delete('borders');
    }
    propKeys.forEach((propKey) => {
      log.warn(`Unknown node property ${propKey}`);
    });
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};
