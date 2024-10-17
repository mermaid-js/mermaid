import rough from 'roughjs';
import { log } from '../../../logger.js';
import type { Node, ShapeRenderOptions } from '../../types.js';
import intersect from '../intersect/index.js';
import { userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, updateNodeBounds } from './util.js';
import type { D3Selection } from '../../../types.js';

export function filledCircle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { themeVariables } }: ShapeRenderOptions
) {
  node.label = '';

  // If incoming height & width are present, subtract the padding from them
  // as labelHelper does not take padding into account
  // also check if the width or height is less than minimum default values (10),
  // if so set it to min value
  if (node.width || node.height) {
    if ((node.width ?? 0) < 10) {
      node.width = 10;
    }

    if ((node.height ?? 0) < 10) {
      node.height = 10;
    }
  }

  if (!node.width) {
    node.width = 10;
  }

  if (!node.height) {
    node.width = 10;
  }

  const shapeSvg = parent
    .insert('g')
    .attr('class', getNodeClasses(node))
    .attr('id', node.domId ?? node.id);
  const radius = (node.width ?? 0) / 2;
  const { cssStyles } = node;

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
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
}
