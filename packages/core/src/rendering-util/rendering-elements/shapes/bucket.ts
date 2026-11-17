import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node, ShapeRenderOptions } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';

/** Bucket shape: an open-top container narrowing to a curved base, with an elliptical rim. */
export async function bucket<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  { config: { themeVariables } }: ShapeRenderOptions
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const accent = themeVariables?.nodeBorder ?? themeVariables?.lineColor ?? 'currentColor';
  const padding = node.padding ?? 12;
  const w = Math.max(bbox.width + padding * 2, node.width ?? 0, 80);
  const rimRy = Math.max(Math.min(w * 0.08, 12), 5);
  const totalHeight = Math.max(bbox.height + padding * 2 + rimRy, node.height ?? 0);
  const topY = -totalHeight / 2 + rimRy;
  const bottomY = totalHeight / 2;
  const bottomW = w * 0.72;

  const body = [
    `M${-w / 2},${topY}`,
    `L${-bottomW / 2},${bottomY}`,
    `A${bottomW / 2},${rimRy} 0 0 0 ${bottomW / 2},${bottomY}`,
    `L${w / 2},${topY}`,
    `A${w / 2},${rimRy} 0 0 0 ${-w / 2},${topY}`,
    `Z`,
  ].join(' ');

  const { cssStyles } = node;
  const group = shapeSvg.insert('g', ':first-child').attr('class', 'basic label-container');

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.path(body, userNodeOverrides(node, {}));
    group.node()?.appendChild(roughNode);
    if (cssStyles) {
      group.attr('style', cssStyles);
    }
  } else {
    group.append('path').attr('d', body).attr('style', nodeStyles);
  }

  group
    .append('ellipse')
    .attr('cx', 0)
    .attr('cy', topY)
    .attr('rx', w / 2)
    .attr('ry', rimRy)
    .attr('style', `fill:none;stroke:${accent};stroke-width:1px`);

  updateNodeBounds(node, group);

  const bodyCenterY = topY + (bottomY - topY) / 2;
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${bodyCenterY - bbox.height / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  // The outline for edge intersection: the rim's upper arc and the base's
  // lower arc, joined by the tapered sides.
  const ARC_SEGMENTS = 12;
  const arc = (rx: number, cy: number, ySign: number) =>
    Array.from({ length: ARC_SEGMENTS + 1 }, (_, i) => {
      const theta = Math.PI - (i * Math.PI) / ARC_SEGMENTS;
      return { x: rx * Math.cos(theta), y: cy + ySign * rimRy * Math.sin(theta) };
    });
  const outline = [...arc(w / 2, topY, -1), ...arc(bottomW / 2, bottomY, 1).reverse()];

  node.intersect = function (point) {
    return intersect.polygon(node, outline, point);
  };

  return shapeSvg;
}
