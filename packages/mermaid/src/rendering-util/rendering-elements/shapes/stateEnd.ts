import { updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node, RenderOptions } from '../../types.js';
import type { SVG } from '../../../diagram-api/types.js';
import rough from 'roughjs';
import { solidStateFill, styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';

export const stateEnd = (
  parent: SVG,
  node: Node,
  { config: { themeVariables } }: RenderOptions
) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { cssStyles } = node;
  const { lineColor } = themeVariables;
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);

  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const roughNode = rc.circle(0, 0, 14, {
    ...solidStateFill(lineColor),
    roughness: 0.5,
    ...options,
  });
  const roughInnerNode = rc.circle(0, 0, 5, {
    ...solidStateFill(lineColor),
    fillStyle: 'solid',
    ...options,
  });
  const circle = shapeSvg.insert(() => roughNode, ':first-child');
  circle.insert(() => roughInnerNode);

  if (cssStyles) {
    circle.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles) {
    circle.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, 7, point);
  };

  return shapeSvg;
};
