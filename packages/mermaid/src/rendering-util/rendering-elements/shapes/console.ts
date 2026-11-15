import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node, ShapeRenderOptions } from '../../types.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

/** Console shape: a rounded terminal window with a command prompt glyph in the top-left. */
export async function consoleWindow<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { themeVariables } }: ShapeRenderOptions
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const accent = themeVariables?.nodeBorder ?? themeVariables?.lineColor ?? 'currentColor';
  const padding = node.padding ?? 12;
  const glyphBand = 20;
  const radius = 12;
  const w = Math.max(bbox.width + padding * 2, node.width ?? 0, 90);
  const h = Math.max(bbox.height + padding * 2 + glyphBand, node.height ?? 0);
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
    .append('text')
    .attr('x', -w / 2 + 12)
    .attr('y', top + 16)
    .attr('class', 'console-glyph')
    .attr('style', `font-family:monospace;font-weight:bold;font-size:14px;fill:${accent}`)
    .text('>_');

  updateNodeBounds(node, group);

  const bodyCenterY = top + glyphBand + (h - glyphBand) / 2;
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${bodyCenterY - bbox.height / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
