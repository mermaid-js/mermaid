import { line } from 'd3';
import type { DrawableElem, LinePlotData, TextElem, XYChartConfig } from '../../interfaces.js';
import type { Axis } from '../axis/index.js';

const CHAR_WIDTH_FACTOR = 0.7;

/**
 * Interpolate a line segment's y-value at a given x.
 * Returns null if x is outside the segment's x-range.
 */
function lineYAtX(segStart: [number, number], segEnd: [number, number], x: number): number | null {
  const [x0, y0] = segStart;
  const [x1, y1] = segEnd;
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  if (x < minX || x > maxX) {
    return null;
  }
  if (x0 === x1) {
    return null; // vertical segment — can't interpolate by x
  }
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

/**
 * Check if a line segment passes through an axis-aligned bounding box.
 *
 * Computes the y-range of the segment within the box's x-range and checks
 * if it overlaps with the box's y-range. This correctly detects the case
 * where a steep line enters from above and exits below the box (or vice
 * versa) even if neither endpoint nor any single sample point falls inside.
 */
function doesSegmentIntersectBox(
  segStart: [number, number],
  segEnd: [number, number],
  boxLeft: number,
  boxRight: number,
  boxTop: number,
  boxBottom: number
): boolean {
  // Check if either endpoint is inside the box
  for (const [ex, ey] of [segStart, segEnd]) {
    if (ex >= boxLeft && ex <= boxRight && ey >= boxTop && ey <= boxBottom) {
      return true;
    }
  }

  // Compute the y-values of the line at the box's left and right x-edges
  const yAtLeft = lineYAtX(segStart, segEnd, boxLeft);
  const yAtRight = lineYAtX(segStart, segEnd, boxRight);

  // Collect valid y-values (where segment overlaps box's x-range)
  const ys: number[] = [];
  if (yAtLeft !== null) {
    ys.push(yAtLeft);
  }
  if (yAtRight !== null) {
    ys.push(yAtRight);
  }

  // Also include segment endpoints that fall within the box's x-range
  for (const [ex, ey] of [segStart, segEnd]) {
    if (ex >= boxLeft && ex <= boxRight) {
      ys.push(ey);
    }
  }

  if (ys.length === 0) {
    return false;
  }

  // The segment's y-range within the box's x-range
  const segMinY = Math.min(...ys);
  const segMaxY = Math.max(...ys);

  // Check if the segment's y-range overlaps with the box's y-range
  return segMaxY >= boxTop && segMinY <= boxBottom;
}

/**
 * Determine if a label placed above (vertical) or to the right (horizontal)
 * of a data point would collide with an adjacent line segment.
 */
function shouldFlipLabelVertical(
  finalData: [number, number][],
  index: number,
  labelText: string,
  fontSize: number,
  labelOffset: number
): boolean {
  const [px, py] = finalData[index];
  const textWidth = fontSize * labelText.length * CHAR_WIDTH_FACTOR;
  const halfWidth = textWidth / 2;
  const halfHeight = fontSize / 2;

  // Bounding box of label placed above the point
  const boxLeft = px - halfWidth;
  const boxRight = px + halfWidth;
  const boxTop = py - labelOffset - halfHeight;
  const boxBottom = py - labelOffset + halfHeight;

  // Check previous segment
  if (
    index > 0 &&
    doesSegmentIntersectBox(
      finalData[index - 1],
      finalData[index],
      boxLeft,
      boxRight,
      boxTop,
      boxBottom
    )
  ) {
    return true;
  }
  // Check next segment
  if (
    index < finalData.length - 1 &&
    doesSegmentIntersectBox(
      finalData[index],
      finalData[index + 1],
      boxLeft,
      boxRight,
      boxTop,
      boxBottom
    )
  ) {
    return true;
  }
  return false;
}

function shouldFlipLabelHorizontal(
  finalData: [number, number][],
  index: number,
  labelText: string,
  fontSize: number,
  labelOffset: number
): boolean {
  // In horizontal orientation, finalData is still [xScaled, yScaled] but
  // the path uses y(d[0]) and x(d[1]), so pixel positions are swapped.
  // px = xAxis.getScaleValue (maps to SVG y), py = yAxis.getScaleValue (maps to SVG x)
  // Label is placed at SVG (py + labelOffset, px) — to the right of the point.
  // We check if that box collides with adjacent segments in SVG space.
  const [px, py] = finalData[index];
  const textWidth = fontSize * labelText.length * CHAR_WIDTH_FACTOR;
  const halfHeight = fontSize / 2;

  // In SVG space for horizontal: svgX = py, svgY = px
  // Label "to the right": svgX = py + labelOffset, svgY = px
  // Box in SVG coords:
  const boxLeft = py + labelOffset;
  const boxRight = py + labelOffset + textWidth;
  const boxTop = px - halfHeight;
  const boxBottom = px + halfHeight;

  // Segments in SVG space: point i has svgX=py_i, svgY=px_i
  const toSvg = (idx: number): [number, number] => [finalData[idx][1], finalData[idx][0]];

  if (
    index > 0 &&
    doesSegmentIntersectBox(toSvg(index - 1), toSvg(index), boxLeft, boxRight, boxTop, boxBottom)
  ) {
    return true;
  }
  if (
    index < finalData.length - 1 &&
    doesSegmentIntersectBox(toSvg(index), toSvg(index + 1), boxLeft, boxRight, boxTop, boxBottom)
  ) {
    return true;
  }
  return false;
}

export class LinePlot {
  constructor(
    private plotData: LinePlotData,
    private xAxis: Axis,
    private yAxis: Axis,
    private orientation: XYChartConfig['chartOrientation'],
    private plotIndex: number
  ) {}

  getDrawableElement(): DrawableElem[] {
    const finalData: [number, number][] = this.plotData.data.map((d) => [
      this.xAxis.getScaleValue(d[0]),
      this.yAxis.getScaleValue(d[1]),
    ]);

    let path: string | null;
    if (this.orientation === 'horizontal') {
      path = line()
        .y((d) => d[0])
        .x((d) => d[1])(finalData);
    } else {
      path = line()
        .x((d) => d[0])
        .y((d) => d[1])(finalData);
    }
    if (!path) {
      return [];
    }

    const elements: DrawableElem[] = [
      {
        groupTexts: ['plot', `line-plot-${this.plotIndex}`],
        type: 'path',
        data: [
          {
            path,
            strokeFill: this.plotData.strokeFill,
            strokeWidth: this.plotData.strokeWidth,
          },
        ],
      },
    ];

    if (this.plotData.pointLabels && this.plotData.pointLabels.length > 0) {
      const labelOffset = 10;
      const fontSize = 12;
      const textData: TextElem[] = [];

      for (const [i, [px, py]] of finalData.entries()) {
        const label = this.plotData.pointLabels[i];
        if (!label) {
          continue;
        }

        if (this.orientation === 'horizontal') {
          const flip = shouldFlipLabelHorizontal(finalData, i, label, fontSize, labelOffset);
          textData.push({
            x: flip ? py - labelOffset : py + labelOffset,
            y: px,
            text: label,
            fill: this.plotData.strokeFill,
            verticalPos: 'middle',
            horizontalPos: flip ? 'right' : 'left',
            fontSize,
            rotation: 0,
          });
        } else {
          const flip = shouldFlipLabelVertical(finalData, i, label, fontSize, labelOffset);
          textData.push({
            x: px,
            y: flip ? py + labelOffset : py - labelOffset,
            text: label,
            fill: this.plotData.strokeFill,
            verticalPos: 'middle',
            horizontalPos: 'center',
            fontSize,
            rotation: 0,
          });
        }
      }

      if (textData.length > 0) {
        elements.push({
          groupTexts: ['plot', `line-plot-${this.plotIndex}`, 'labels'],
          type: 'text',
          data: textData,
        });
      }
    }

    return elements;
  }
}
