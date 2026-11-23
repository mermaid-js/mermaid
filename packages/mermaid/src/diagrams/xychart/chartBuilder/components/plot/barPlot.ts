import type { BarPlotData, BoundingRect, DrawableElem, XYChartConfig } from '../../interfaces.js';
import type { Axis } from '../axis/index.js';

export class BarPlot {
  constructor(
    private barData: BarPlotData,
    private boundingRect: BoundingRect,
    private xAxis: Axis,
    private yAxis: Axis,
    private orientation: XYChartConfig['chartOrientation'],
    private plotIndex: number
  ) {}

  /**
   * The value-axis position of zero, clamped to the plot rect. The value
   * scale's range is inset by the axis outerPadding, so the axis line sits
   * outerPadding beyond scaled zero; anchoring bars at the axis line would
   * overstate small bars by that inset. When zero falls outside the domain
   * the clamped value is the plot edge, preserving the old behaviour.
   */
  private getZeroBaseline(min: number, max: number): number {
    return Math.min(Math.max(this.yAxis.getScaleValue(0), min), max);
  }

  /**
   * The [start, end] interval a bar spans along the value axis, clipped to
   * the plot rect. The renderer draws rects without plot clipping, so an
   * out-of-domain bar must not spill outside the plot: the whole
   * value-to-baseline interval is intersected with the plot bounds, and a
   * bar whose interval misses the plot entirely comes back zero-length.
   *
   * A degenerate value scale (a collapsed domain such as [5, 5]) maps every
   * input — zero included — to one point, so the interval would collapse
   * and a nonzero bar would vanish. For a nonzero bar the interval then
   * falls back to the pre-baseline anchor, the plot edge, restoring the
   * rendering constant datasets had before bars were anchored at zero.
   * Genuinely zero-valued bars keep their zero length.
   */
  private getBarInterval(
    scaledValue: number,
    rawValue: number,
    baseline: number,
    rawBaseline: number,
    plotMin: number,
    plotMax: number,
    fallbackEdge: number
  ): [number, number] {
    let lo = Math.min(scaledValue, baseline);
    let hi = Math.max(scaledValue, baseline);
    if (scaledValue === rawBaseline && rawValue !== 0) {
      lo = Math.min(scaledValue, fallbackEdge);
      hi = Math.max(scaledValue, fallbackEdge);
    }
    lo = Math.max(lo, plotMin);
    hi = Math.min(hi, plotMax);
    return [lo, Math.max(hi, lo)];
  }

  getDrawableElement(): DrawableElem[] {
    const barPaddingPercent = 0.05;

    const barWidth =
      Math.min(this.xAxis.getAxisOuterPadding() * 2, this.xAxis.getTickDistance()) *
      (1 - barPaddingPercent);
    const barWidthHalf = barWidth / 2;

    // The unclamped position of zero: comparing each bar's scaled value
    // against it, rather than the clamped baseline, is what exposes a
    // degenerate value scale.
    const rawBaseline = this.yAxis.getScaleValue(0);

    if (this.orientation === 'horizontal') {
      const plotMin = this.boundingRect.x;
      const plotMax = this.boundingRect.x + this.boundingRect.width;
      const baseline = this.getZeroBaseline(plotMin, plotMax);
      return [
        {
          groupTexts: ['plot', `bar-plot-${this.plotIndex}`],
          type: 'rect',
          data: this.barData.data.map((d) => {
            const [lo, hi] = this.getBarInterval(
              this.yAxis.getScaleValue(d[1]),
              d[1],
              baseline,
              rawBaseline,
              plotMin,
              plotMax,
              plotMin
            );
            return {
              x: lo,
              y: this.xAxis.getScaleValue(d[0]) - barWidthHalf,
              height: barWidth,
              width: hi - lo,
              fill: this.barData.fill,
              strokeWidth: 0,
              strokeFill: this.barData.fill,
            };
          }),
        },
      ];
    }
    const plotMin = this.boundingRect.y;
    const plotMax = this.boundingRect.y + this.boundingRect.height;
    const baseline = this.getZeroBaseline(plotMin, plotMax);
    return [
      {
        groupTexts: ['plot', `bar-plot-${this.plotIndex}`],
        type: 'rect',
        data: this.barData.data.map((d) => {
          const [lo, hi] = this.getBarInterval(
            this.yAxis.getScaleValue(d[1]),
            d[1],
            baseline,
            rawBaseline,
            plotMin,
            plotMax,
            plotMax
          );
          return {
            x: this.xAxis.getScaleValue(d[0]) - barWidthHalf,
            y: lo,
            width: barWidth,
            height: hi - lo,
            fill: this.barData.fill,
            strokeWidth: 0,
            strokeFill: this.barData.fill,
          };
        }),
      },
    ];
  }
}
