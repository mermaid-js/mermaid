import rough from 'roughjs';
import type { Bounds, D3Selection, Point } from '../../../types.js';
import type { Node } from '../../types.js';
import { handleUndefinedAttr } from '../../../utils.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';

/**
 * Shared by the circle itself and the `socket` edge marker (`markers.js`), so a
 * required-interface socket arc hugs this exact boundary rather than a
 * differently-sized one.
 */
export const INTERFACE_RADIUS = 6;

const CAPTION_GAP = 4;

/**
 * Puts a small glyph's caption below it, or to its right, and returns a footprint that
 * mirrors the caption on the opposite side. The node centre so stays on the glyph centre,
 * where edges clip, while layout still keeps the caption clear of other elements.
 */
export const placeGlyphCaption = (
  node: Node,
  label: D3Selection<SVGGElement>,
  bbox: { width: number; height: number },
  glyphHalf: number
): { width: number; height: number } => {
  const reach = glyphHalf + CAPTION_GAP;
  if (node.captionSide === 'right') {
    label.attr('transform', `translate(${reach}, ${-bbox.height / 2})`);
    return {
      width: 2 * (reach + bbox.width),
      height: Math.max(2 * glyphHalf, bbox.height),
    };
  }
  label.attr('transform', `translate(${-bbox.width / 2}, ${reach})`);
  return {
    width: Math.max(2 * glyphHalf, bbox.width),
    height: 2 * (reach + bbox.height),
  };
};

/**
 * UML "lollipop" interface ball: a small circle, fixed in size regardless of the label,
 * so it stays a lollipop and lines up with the fixed-size `socket` marker. The name is
 * an external caption (see `placeGlyphCaption`).
 */
export async function umlInterface<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node), {
    ignoreMinWidth: true,
  });

  let circleElem;
  const { cssStyles } = node;

  if (node.look === 'handDrawn') {
    // @ts-expect-error -- Passing a D3.Selection seems to work for some reason
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, { fill: 'transparent' });
    const roughNode = rc.circle(0, 0, INTERFACE_RADIUS * 2, options);
    circleElem = shapeSvg.insert(() => roughNode, ':first-child');
    circleElem.attr('class', 'basic label-container').attr('style', handleUndefinedAttr(cssStyles));
  } else {
    circleElem = shapeSvg
      .insert('circle', ':first-child')
      .attr('class', 'basic label-container')
      .attr('style', nodeStyles)
      .attr('r', INTERFACE_RADIUS)
      .attr('cx', 0)
      .attr('cy', 0);
  }

  updateNodeBounds(node, circleElem, placeGlyphCaption(node, label, bbox, INTERFACE_RADIUS));

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    return intersect.circle(bounds, INTERFACE_RADIUS, point);
  };
  node.intersect = function (point) {
    return intersect.circle(node, INTERFACE_RADIUS, point);
  };

  return shapeSvg;
}
