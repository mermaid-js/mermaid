import rough from 'roughjs';
import type { Node, ShapeRenderOptions } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, updateNodeBounds } from './util.js';
import type { D3Selection } from '../../../types.js';

export function forkJoin<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { dir, config: { state, themeVariables } }: ShapeRenderOptions
) {
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

  // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {
    stroke: themeVariables.lineColor,
    fill: themeVariables.lineColor,
  });

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
  const padding = state?.padding ?? 0;
  if (node.width && node.height) {
    node.width += padding / 2 || 0;
    node.height += padding / 2 || 0;
  }
  node.intersect = function (point) {
    return intersect.rect(node, point);
  };
  return shapeSvg;
}
