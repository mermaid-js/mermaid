import { log } from '../../../logger.js';
import { updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { handleUndefinedAttr } from '../../../utils.js';
import type { D3Selection } from '../../../types.js';

export function anchor<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const classes = getNodeClasses(node);
  let cssClasses = classes;
  if (!classes) {
    cssClasses = 'anchor';
  }
  const shapeSvg = parent
    .insert('g')
    .attr('class', cssClasses)
    .attr('id', node.domId || node.id);

  const radius = 1;

  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, { fill: 'black', stroke: 'none', fillStyle: 'solid' });

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
  }
  const roughNode = rc.circle(0, 0, radius * 2, options);
  const circleElem = shapeSvg.insert(() => roughNode, ':first-child');
  circleElem.attr('class', 'anchor').attr('style', handleUndefinedAttr(cssStyles));

  updateNodeBounds(node, circleElem);

  node.intersect = function (point) {
    log.info('Circle intersect', node, radius, point);
    return intersect.circle(node, radius, point);
  };

  return shapeSvg;
}
