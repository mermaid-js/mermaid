import rough from 'roughjs';
import { getConfig } from '../../../config.js';
import type { SVG } from '../../../diagram-api/types.js';
import { log } from '../../../logger.js';
import type { Node } from '../../types.d.ts';
import intersect from '../intersect/index.js';
import { userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, updateNodeBounds } from './util.js';

export const filledCircle = (parent: SVG, node: Node) => {
  node.label = '';
  const shapeSvg = parent
    .insert('g')
    .attr('class', getNodeClasses(node))
    .attr('id', node.domId ?? node.id);
  const radius = 7;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const { themeVariables } = getConfig();
  const { nodeBorder } = themeVariables;
  const options = userNodeOverrides(node, { fillStyle: 'solid' });

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
  }

  const circleNode = rc.circle(0, 0, radius * 2, options);

  const filledCircle = shapeSvg.insert(() => circleNode, ':first-child');

  filledCircle.selectAll('path').attr('style', `fill: ${nodeBorder} !important;`);

  if (cssStyles && cssStyles.length > 0 && node.look !== 'handDrawn') {
    filledCircle.selectAll('path').attr('style', cssStyles);
  }

  updateNodeBounds(node, filledCircle);

  node.intersect = function (point) {
    log.info('filledCircle intersect', node, { radius, point });
    const pos = intersect.circle(node, radius, point);
    return pos;
  };

  return shapeSvg;
};
