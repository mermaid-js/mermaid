import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';

export const doublecircle = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const { labelStyles, nodeStyles } = styles2String(node);
  const gap = 5;
  node.labelStyle = labelStyles;
  const padding = node.padding ?? 0;

  if (node.width || node.height) {
    node.width = (node?.width ?? 0) - padding * 2 - gap * 2;
    if (node.width < 50) {
      node.width = 50;
    }

    node.height = (node?.height ?? 0) - padding * 2 - gap * 2;
    if (node.height < 50) {
      node.height = 50;
    }
  }

  const { shapeSvg, halfPadding } = await labelHelper(parent, node, getNodeClasses(node));
  const labelPadding = node.look === 'neo' ? halfPadding * 2 : halfPadding;

  const outerRadius = (node.width ?? 0) / 2 + labelPadding + gap;
  const innerRadius = outerRadius - gap;

  let circleGroup;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-ignore - rough is not typed
    const rc = rough.svg(shapeSvg);
    const outerOptions = userNodeOverrides(node, { roughness: 0.2, strokeWidth: 2.5 });

    const innerOptions = userNodeOverrides(node, { roughness: 0.2, strokeWidth: 1.5 });
    const outerRoughNode = rc.circle(0, 0, outerRadius * 2, outerOptions);
    const innerRoughNode = rc.circle(0, 0, innerRadius * 2, innerOptions);

    circleGroup = shapeSvg.insert('g', ':first-child');
    // circleGroup = circleGroup.insert(() => outerRoughNode, ':first-child');
    circleGroup.attr('class', node.cssClasses).attr('style', cssStyles);

    circleGroup.node()?.appendChild(outerRoughNode);
    circleGroup.node()?.appendChild(innerRoughNode);
  } else {
    circleGroup = shapeSvg.insert('g', ':first-child');

    const outerCircle = circleGroup.insert('circle', ':first-child');
    const innerCircle = circleGroup.insert('circle');
    circleGroup.attr('class', 'basic label-container').attr('style', nodeStyles);

    outerCircle
      .attr('class', 'outer-circle')
      .attr('style', nodeStyles)
      .attr('r', outerRadius)
      .attr('cx', 0)
      .attr('cy', 0);

    innerCircle
      .attr('class', 'inner-circle')
      .attr('style', nodeStyles)
      .attr('r', innerRadius)
      .attr('cx', 0)
      .attr('cy', 0);
  }

  updateNodeBounds(node, circleGroup);

  node.intersect = function (point) {
    log.info('DoubleCircle intersect', node, outerRadius, point);
    return intersect.circle(node, outerRadius, point);
  };

  return shapeSvg;
};
