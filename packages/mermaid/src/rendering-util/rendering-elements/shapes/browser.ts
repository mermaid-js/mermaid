import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node, ShapeRenderOptions } from '../../types.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

/** Browser shape: a rounded window with a chrome bar of dots and an address-bar hint. */
export async function browser<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { themeVariables } }: ShapeRenderOptions
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const accent = themeVariables?.nodeBorder ?? themeVariables?.lineColor ?? 'currentColor';
  const padding = node.padding ?? 12;
  const barHeight = 18;
  const radius = 12;
  const w = Math.max(bbox.width + padding * 2, node.width ?? 0, 90);
  const h = Math.max(bbox.height + padding * 2 + barHeight, node.height ?? 0);
  const top = -h / 2;

  const { cssStyles } = node;
  const group = shapeSvg.insert('g', ':first-child').attr('class', 'basic label-container');

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.path(
      createRoundedRectPathD(-w / 2, top, w, h, radius),
      userNodeOverrides(node, {})
    );
    group.node()?.appendChild(roughNode);
    if (cssStyles) {
      group.attr('style', cssStyles);
    }
  } else {
    group
      .append('rect')
      .attr('x', -w / 2)
      .attr('y', top)
      .attr('width', w)
      .attr('height', h)
      .attr('rx', radius)
      .attr('ry', radius)
      .attr('style', nodeStyles);
  }

  group
    .append('line')
    .attr('x1', -w / 2)
    .attr('y1', top + barHeight)
    .attr('x2', w / 2)
    .attr('y2', top + barHeight)
    .attr('style', `stroke:${accent};stroke-width:1px`);

  for (let i = 0; i < 3; i++) {
    group
      .append('circle')
      .attr('cx', -w / 2 + 12 + i * 9)
      .attr('cy', top + barHeight / 2)
      .attr('r', 2.5)
      .attr('style', `fill:${accent};stroke:none`);
  }

  group
    .append('rect')
    .attr('class', 'browser-address-bar')
    .attr('x', -w / 2 + 44)
    .attr('y', top + 4)
    .attr('width', Math.max(w - 56, 10))
    .attr('height', barHeight - 8)
    .attr('rx', 3)
    .attr('ry', 3)
    .attr('style', `fill:none;stroke:${accent};stroke-width:1px;opacity:0.6`);

  updateNodeBounds(node, group);

  const bodyCenterY = top + barHeight + (h - barHeight) / 2;
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${bodyCenterY - bbox.height / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
