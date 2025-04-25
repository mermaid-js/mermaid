import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { createRoundedRectPathD } from './roundedRectPath.js';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';

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

export async function stadium<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const h = bbox.height + node.padding;
  const w = bbox.width + h / 4 + node.padding;

  let rect;
  const { cssStyles } = node;
  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});

    const pathData = createRoundedRectPathD(-w / 2, -h / 2, w, h, h / 2);
    const roughNode = rc.path(pathData, options);

    rect = shapeSvg.insert(() => roughNode, ':first-child');
    rect.attr('class', 'basic label-container').attr('style', handleUndefinedAttr(cssStyles));
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
}
