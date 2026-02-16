import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';

export async function doublecircle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, halfPadding } = await labelHelper(parent, node, getNodeClasses(node));
  const gap = 5;
  const outerRadius = bbox.width / 2 + halfPadding + gap;
  const innerRadius = bbox.width / 2 + halfPadding;

  let circleGroup;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const outerOptions = userNodeOverrides(node, { roughness: 0.2, strokeWidth: 2.5 });

    const innerOptions = userNodeOverrides(node, { roughness: 0.2, strokeWidth: 1.5 });
    const outerRoughNode = rc.circle(0, 0, outerRadius * 2, outerOptions);
    const innerRoughNode = rc.circle(0, 0, innerRadius * 2, innerOptions);

    circleGroup = shapeSvg.insert('g', ':first-child');
    // circleGroup = circleGroup.insert(() => outerRoughNode, ':first-child');
    circleGroup
      .attr('class', handleUndefinedAttr(node.cssClasses))
      .attr('style', handleUndefinedAttr(cssStyles));

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
}
