/**
 * Bounding box used for label transform computation.
 * For SVG getBBox(), x/y may be present; for HTML getBoundingClientRect(), only width/height are used.
 */
export interface LabelBBox {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

/**
 * Compute the SVG translate transform needed to center a label element at the origin.
 *
 * For HTML labels, getBoundingClientRect() is used and its x/y are viewport-absolute,
 * so only width/height are relevant for centering within the SVG group.
 *
 * For SVG labels, getBBox() returns coordinates in the element's local coordinate system.
 * When addSvgBackground is true, the background <rect> extends beyond the text (making
 * bbox.x/y negative), so we include those offsets to correctly center the visual
 * content at the origin.
 *
 * @param bbox - The bounding box of the label element
 * @param useHtmlLabels - Whether HTML labels are in use
 * @returns SVG transform string, e.g. "translate(-20, -10)"
 */
export const computeLabelTransform = (bbox: LabelBBox, useHtmlLabels: boolean): string => {
  if (useHtmlLabels) {
    return 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')';
  }
  const x = bbox.x ?? 0;
  const y = bbox.y ?? 0;
  return 'translate(' + -(x + bbox.width / 2) + ', ' + -(y + bbox.height / 2) + ')';
};
