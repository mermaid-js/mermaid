/**
 * Coordinate converter — translates between screen pixel coordinates and SVG viewBox coordinates.
 *
 * Core formula:
 *   viewBoxX = (clientX - svgRect.left) * (viewBox.width / svgRect.width) + viewBox.x
 *   viewBoxY = (clientY - svgRect.top)  * (viewBox.height / svgRect.height) + viewBox.y
 */
export class CoordinateConverter {
  private svgElement: SVGSVGElement;

  constructor(svgElement: SVGElement) {
    this.svgElement = svgElement as SVGSVGElement;
  }

  /** Converts browser clientX/clientY to SVG viewBox coordinates. */
  clientToViewBox(clientX: number, clientY: number): { x: number; y: number } {
    const svgRect = this.svgElement.getBoundingClientRect();
    const viewBox = this.svgElement.viewBox.baseVal;

    if (!viewBox) {
      return { x: clientX, y: clientY };
    }

    const scaleX = viewBox.width / svgRect.width;
    const scaleY = viewBox.height / svgRect.height;

    return {
      x: (clientX - svgRect.left) * scaleX + viewBox.x,
      y: (clientY - svgRect.top) * scaleY + viewBox.y,
    };
  }

  /** Converts SVG viewBox coordinates to screen clientX/clientY. */
  viewBoxToClient(viewBoxX: number, viewBoxY: number): { x: number; y: number } {
    const svgRect = this.svgElement.getBoundingClientRect();
    const viewBox = this.svgElement.viewBox.baseVal;

    if (!viewBox) {
      return { x: viewBoxX, y: viewBoxY };
    }

    const scaleX = svgRect.width / viewBox.width;
    const scaleY = svgRect.height / viewBox.height;

    return {
      x: (viewBoxX - viewBox.x) * scaleX + svgRect.left,
      y: (viewBoxY - viewBox.y) * scaleY + svgRect.top,
    };
  }
}
