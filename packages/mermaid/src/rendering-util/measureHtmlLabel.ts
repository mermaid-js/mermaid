/**
 * Measure an HTML label in the SVG user units used by its foreignObject.
 * Client rects include ancestor CSS transforms, whereas SVG geometry does not.
 * Keep the HTML rect's position convention: callers use dimensions for layout
 * and distinguish HTML boxes from SVG getBBox() results by their left/top fields.
 */
export function measureHtmlLabel(element: Element): DOMRect {
  const bounds = element.getBoundingClientRect();
  const foreignObject = element.closest('foreignObject') as SVGGraphicsElement | null;
  const matrix = foreignObject?.getScreenCTM?.();
  if (
    !matrix ||
    ![matrix.a, matrix.b, matrix.c, matrix.d].every(Number.isFinite) ||
    matrix.a === 0 ||
    matrix.d === 0 ||
    matrix.b !== 0 ||
    matrix.c !== 0
  ) {
    // A rotated/skewed axis-aligned client rect cannot be inverted by dividing
    // its dimensions. Preserve existing behavior rather than inventing bounds.
    return bounds;
  }
  return new DOMRect(
    bounds.x,
    bounds.y,
    bounds.width / Math.abs(matrix.a),
    bounds.height / Math.abs(matrix.d)
  );
}
