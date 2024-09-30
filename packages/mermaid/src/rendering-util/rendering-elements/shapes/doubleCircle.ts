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
  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  if (node.width || node.height) {
    const padding = node.padding ?? 0;
    node.width = (node?.width ?? 0) - padding * 2;
    if (node.width < 50) {
      node.width = 50;
    }

    node.height = (node?.height ?? 0) - (node.padding ?? 0) * 2;
    if (node.height < 50) {
      node.height = 50;
    }
  }

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const outerRadius = Math.max(bbox.width / 2, (node?.width ?? 0) / 2) + (node.padding ?? 0);
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
