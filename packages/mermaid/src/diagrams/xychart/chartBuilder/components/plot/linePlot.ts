import { line } from 'd3';
import type {
  Dimension,
  DrawableElem,
  LinePlotData,
  TextElem,
  XYChartConfig,
} from '../../interfaces.js';
import type { TextDimensionCalculator } from '../../textDimensionCalculator.js';
import type { Axis } from '../axis/index.js';

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
 * Check whether either adjacent segment (prev→current or current→next) intersects
 * the given bounding box. Points are provided in the coordinate system already
 * expected by doesSegmentIntersectBox.
 */
function adjacentSegmentsIntersectBox(
  points: [number, number][],
  index: number,
  boxLeft: number,
  boxRight: number,
  boxTop: number,
  boxBottom: number
): boolean {
  if (
    index > 0 &&
    doesSegmentIntersectBox(points[index - 1], points[index], boxLeft, boxRight, boxTop, boxBottom)
  ) {
    return true;
  }
  if (
    index < points.length - 1 &&
    doesSegmentIntersectBox(points[index], points[index + 1], boxLeft, boxRight, boxTop, boxBottom)
  ) {
    return true;
  }
  return false;
}

interface LabelPlacement {
  flip: boolean;
  offset: number;
}

interface PlotBounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Compute the best placement for a label on a vertical chart.
 *
 * Tries placing the label above the point first. If the adjacent line segments
 * collide with that bounding box, or the label would clip outside the plot area,
 * tries below. Retries with increasing offsets (up to 3x the base). Returns the
 * first collision-free, non-clipping placement, or above at base offset as fallback.
 *
 * The bounding box is expanded by strokeWidth / 2 on all sides to account for the
 * visual width of the line itself.
 */
function computeLabelPlacementVertical(
  finalData: [number, number][],
  index: number,
  textDim: Dimension,
  baseOffset: number,
  strokeWidth: number,
  plotBounds: PlotBounds
): LabelPlacement {
  const [px, py] = finalData[index];
  const halfWidth = textDim.width / 2;
  const halfHeight = textDim.height / 2;
  const strokePad = strokeWidth / 2;

  const boxLeft = px - halfWidth - strokePad;
  const boxRight = px + halfWidth + strokePad;

  for (const offset of [baseOffset, baseOffset * 2, baseOffset * 3]) {
    const aboveTop = py - offset - halfHeight - strokePad;
    const aboveBottom = py - offset + halfHeight + strokePad;
    if (
      aboveTop >= plotBounds.top &&
      !adjacentSegmentsIntersectBox(finalData, index, boxLeft, boxRight, aboveTop, aboveBottom)
    ) {
      return { flip: false, offset };
    }

    const belowTop = py + offset - halfHeight - strokePad;
    const belowBottom = py + offset + halfHeight + strokePad;
    if (
      belowBottom <= plotBounds.bottom &&
      !adjacentSegmentsIntersectBox(finalData, index, boxLeft, boxRight, belowTop, belowBottom)
    ) {
      return { flip: true, offset };
    }
  }

  return { flip: false, offset: baseOffset };
}

/**
 * Compute the best placement for a label on a horizontal chart.
 *
 * In horizontal orientation finalData is [xAxisScale, yAxisScale] but the SVG path
 * swaps them: svgX = yAxisScale (d[1]), svgY = xAxisScale (d[0]). Collision checks
 * are performed in SVG space. The default position is to the right of the point;
 * the flipped position is to the left.
 *
 * Also guards against the label clipping outside the plot's left or right boundary.
 */
function computeLabelPlacementHorizontal(
  finalData: [number, number][],
  index: number,
  textDim: Dimension,
  baseOffset: number,
  strokeWidth: number,
  plotBounds: PlotBounds
): LabelPlacement {
  const [px, py] = finalData[index];
  const halfHeight = textDim.height / 2;
  const strokePad = strokeWidth / 2;

  const svgPoints = finalData.map((d): [number, number] => [d[1], d[0]]);

  const boxTop = px - halfHeight - strokePad;
  const boxBottom = px + halfHeight + strokePad;

  for (const offset of [baseOffset, baseOffset * 2, baseOffset * 3]) {
    const rightLeft = py + offset - strokePad;
    const rightRight = py + offset + textDim.width + strokePad;
    if (
      rightRight <= plotBounds.right &&
      !adjacentSegmentsIntersectBox(svgPoints, index, rightLeft, rightRight, boxTop, boxBottom)
    ) {
      return { flip: false, offset };
    }

    const leftLeft = py - offset - textDim.width - strokePad;
    const leftRight = py - offset + strokePad;
    if (
      leftLeft >= plotBounds.left &&
      !adjacentSegmentsIntersectBox(svgPoints, index, leftLeft, leftRight, boxTop, boxBottom)
    ) {
      return { flip: true, offset };
    }
  }

  return { flip: false, offset: baseOffset };
}

export class LinePlot {
  constructor(
    private plotData: LinePlotData,
    private xAxis: Axis,
    private yAxis: Axis,
    private chartConfig: XYChartConfig,
    private plotIndex: number,
    private textDimensionCalculator: TextDimensionCalculator
  ) {}

  getDrawableElement(): DrawableElem[] {
    const finalData: [number, number][] = this.plotData.data.map((d) => [
      this.xAxis.getScaleValue(d[0]),
      this.yAxis.getScaleValue(d[1]),
    ]);

    let path: string | null;
    if (this.chartConfig.chartOrientation === 'horizontal') {
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
      const fontSize = this.chartConfig.xAxis.labelFontSize;
      const labelOffset = fontSize + 2;
      const textData: TextElem[] = [];

      const [yRangeA, yRangeB] = this.yAxis.getRange();
      const [xRangeA, xRangeB] = this.xAxis.getRange();
      let plotBounds: PlotBounds;
      if (this.chartConfig.chartOrientation === 'horizontal') {
        plotBounds = {
          top: Math.min(xRangeA, xRangeB),
          bottom: Math.max(xRangeA, xRangeB),
          left: Math.min(yRangeA, yRangeB),
          right: Math.max(yRangeA, yRangeB),
        };
      } else {
        plotBounds = {
          top: Math.min(yRangeA, yRangeB),
          bottom: Math.max(yRangeA, yRangeB),
          left: Math.min(xRangeA, xRangeB),
          right: Math.max(xRangeA, xRangeB),
        };
      }

      for (const [i, [px, py]] of finalData.entries()) {
        const label = this.plotData.pointLabels[i];
        if (!label) {
          continue;
        }

        const textDim = this.textDimensionCalculator.getMaxDimension([label], fontSize);

        if (this.chartConfig.chartOrientation === 'horizontal') {
          const { flip, offset } = computeLabelPlacementHorizontal(
            finalData,
            i,
            textDim,
            labelOffset,
            this.plotData.strokeWidth,
            plotBounds
          );
          textData.push({
            x: flip ? py - offset : py + offset,
            y: px,
            text: label,
            fill: this.plotData.strokeFill,
            verticalPos: 'middle',
            horizontalPos: flip ? 'right' : 'left',
            fontSize,
            rotation: 0,
          });
        } else {
          const { flip, offset } = computeLabelPlacementVertical(
            finalData,
            i,
            textDim,
            labelOffset,
            this.plotData.strokeWidth,
            plotBounds
          );
          textData.push({
            x: px,
            y: flip ? py + offset : py - offset,
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
