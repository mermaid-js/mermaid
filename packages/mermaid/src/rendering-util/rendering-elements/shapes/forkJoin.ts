import rough from 'roughjs';
import type { Node, ShapeRenderOptions } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, updateNodeBounds } from './util.js';
import type { D3Selection } from '../../../types.js';
import type { Bounds, Point } from '../../../types.js';

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
  let width = node?.width ? node?.width : 70;
  let height = node?.height ? node?.height : 10;

  if (dir === 'LR') {
    width = node?.width ? node?.width : 10;
    height = node?.height ? node?.height : 70;
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
  if (node.look !== 'handDrawn') {
    shape.attr('class', 'outer-path');
  }
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
  node.calcIntersect = function (bounds: Bounds, point: Point) {
    return intersect.rect(bounds, point);
  };

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };
  return shapeSvg;
}
