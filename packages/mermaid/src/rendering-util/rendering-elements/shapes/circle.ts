import { log } from '../../../logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';

export async function circle<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (50),
  // if so set it to min value
  const padding = node.padding ?? 0;
  const labelPadding = node.look === 'neo' ? 16 : padding;
  if (node.width || node.height) {
    node.width = (node.width ?? 6) - labelPadding * 2;
    node.height = node.width;
  }
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const radius = (node?.width ? node?.width / 2 : bbox.width / 2) + labelPadding * 2;
  let circleElem;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {});
    const roughNode = rc.circle(0, 0, radius * 2, options);

    circleElem = shapeSvg.insert(() => roughNode, ':first-child');
    circleElem.attr('class', 'basic label-container').attr('style', handleUndefinedAttr(cssStyles));
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

  node.intersect = function (point) {
    log.info('Circle intersect', node, radius, point);
    return intersect.circle(node, radius, point);
  };

  return shapeSvg;
}
