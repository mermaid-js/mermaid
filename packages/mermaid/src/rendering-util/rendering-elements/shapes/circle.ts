import { log } from '../../../logger.js';
import type { Bounds, D3Selection, Point } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';
import type { MindmapOptions, Node, ShapeRenderOptions } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import rough from 'roughjs';

const ICON_SIZE = 30;
const ICON_PADDING = 20;

export async function circle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  options?: MindmapOptions | ShapeRenderOptions
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, halfPadding, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node)
  );

  const padding = options?.padding ?? halfPadding;
  let radius = bbox.width / 2 + padding;
  let labelXOffset = -bbox.width / 2;
  const labelYOffset = -bbox.height / 2;

  if (node.icon) {
    const totalWidthNeeded = bbox.width + ICON_SIZE + ICON_PADDING * 2;
    const minRadiusWithIcon = totalWidthNeeded / 2 + padding;
    radius = Math.max(radius, minRadiusWithIcon);
    labelXOffset = -radius + ICON_SIZE + ICON_PADDING;
    label.attr('transform', `translate(${labelXOffset}, ${labelYOffset})`);
  }

  node.width = radius * 2;
  node.height = radius * 2;
  let circleElem;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const roughNode = rc.circle(0, 0, radius * 2, options);

    circleElem = shapeSvg.insert(() => roughNode, ':first-child');
    circleElem
      .attr('class', 'basic label-container')
      .attr('style', handleUndefinedAttr(node.cssStyles));
  } else {
    circleElem = shapeSvg
      .insert('circle', ':first-child')
      .attr('class', 'basic label-container')
      .attr('style', nodeStyles)
      .attr('r', radius)
      .attr('cx', 0)
      .attr('cy', 0);
  }

  updateNodeBounds(node, circleElem);
  node.calcIntersect = function (bounds: Bounds, point: Point) {
    const radius = bounds.width / 2;
    return intersect.circle(bounds, radius, point);
  };
  node.intersect = function (point) {
    log.info('Circle intersect', node, radius, point);
    return intersect.circle(node, radius, point);
  };

  return shapeSvg;
}
