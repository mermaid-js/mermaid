/**
 * 坐标转换器 —— 在屏幕像素坐标和 SVG viewBox 坐标之间转换。
 *
 * 核心公式：
 *   viewBoxX = (clientX - svgRect.left) * (viewBox.width / svgRect.width) + viewBox.x
 *   viewBoxY = (clientY - svgRect.top)  * (viewBox.height / svgRect.height) + viewBox.y
 */
export class CoordinateConverter {
  private svgElement: SVGSVGElement;

  constructor(svgElement: SVGElement) {
    this.svgElement = svgElement as SVGSVGElement;
  }

  /**
   * 将浏览器 clientX/clientY 转换为 SVG viewBox 坐标系中的坐标
   */
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

  /**
   * 将 SVG viewBox 坐标转换为屏幕 clientX/clientY
   */
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
