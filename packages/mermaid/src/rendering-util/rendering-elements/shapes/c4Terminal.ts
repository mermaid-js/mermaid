import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';

/** C4 terminal shape: a rounded box with a console prompt glyph, for server-side apps. */
export async function c4Terminal<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const padding = node.padding ?? 12;
  const glyphBand = 18;
  const w = Math.max(bbox.width + padding * 2, 80);
  const h = bbox.height + padding * 2 + glyphBand;
  const top = -h / 2;

  const group = shapeSvg.insert('g', ':first-child').attr('class', 'basic label-container');

  group
    .append('rect')
    .attr('x', -w / 2)
    .attr('y', top)
    .attr('width', w)
    .attr('height', h)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('style', nodeStyles);

  group
    .append('text')
    .attr('x', -w / 2 + 10)
    .attr('y', top + 16)
    .attr('class', 'c4-terminal-glyph')
    .attr('style', 'font-family:monospace;font-weight:bold;fill:#ffffff')
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
