import { getNodeClasses, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import type { SVG } from '../../../diagram-api/types.js';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';

export const forkJoin = (parent: SVG, node: Node, dir: string) => {
  const { nodeStyles } = styles2String(node);
  node.label = '';
  const shapeSvg = parent
    .insert('g')
    .attr('class', getNodeClasses(node))
    .attr('id', node.domId ?? node.id);

  const { cssStyles } = node;
  let width = Math.max(70, node?.width ?? 0);
  let height = Math.max(10, node?.height ?? 0);

  if (dir === 'LR') {
    width = Math.max(10, node?.width ?? 0);
    height = Math.max(70, node?.height ?? 0);
  }

  const x = (-1 * width) / 2;
  const y = (-1 * height) / 2;

  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const roughNode = rc.rectangle(x, y, width, height, options);

  const shape = shapeSvg.insert(() => roughNode, ':first-child');

  if (cssStyles && node.look !== 'handDrawn') {
    shape.selectAll('path').attr('style', cssStyles);
  }

  if (nodeStyles && node.look !== 'handDrawn') {
    shape.selectAll('path').attr('style', nodeStyles);
  }

  updateNodeBounds(node, shape);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };
  return shapeSvg;
};
