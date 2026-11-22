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

  getDrawableElement(): DrawableElem[] {
    const finalData: [number, number][] = this.barData.data.map((d) => [
      this.xAxis.getScaleValue(d[0]),
      this.yAxis.getScaleValue(d[1]),
    ]);

    const barPaddingPercent = 0.05;

    const barWidth =
      Math.min(this.xAxis.getAxisOuterPadding() * 2, this.xAxis.getTickDistance()) *
      (1 - barPaddingPercent);
    const barWidthHalf = barWidth / 2;

    if (this.orientation === 'horizontal') {
      const baseline = this.getZeroBaseline(
        this.boundingRect.x,
        this.boundingRect.x + this.boundingRect.width
      );
      return [
        {
          groupTexts: ['plot', `bar-plot-${this.plotIndex}`],
          type: 'rect',
          data: finalData.map((data) => ({
            x: Math.min(baseline, data[1]),
            y: data[0] - barWidthHalf,
            height: barWidth,
            width: Math.abs(data[1] - baseline),
            fill: this.barData.fill,
            strokeWidth: 0,
            strokeFill: this.barData.fill,
          })),
        },
      ];
    }
    const baseline = this.getZeroBaseline(
      this.boundingRect.y,
      this.boundingRect.y + this.boundingRect.height
    );
    return [
      {
        groupTexts: ['plot', `bar-plot-${this.plotIndex}`],
        type: 'rect',
        data: finalData.map((data) => ({
          x: data[0] - barWidthHalf,
          y: Math.min(data[1], baseline),
          width: barWidth,
          height: Math.abs(baseline - data[1]),
          fill: this.barData.fill,
          strokeWidth: 0,
          strokeFill: this.barData.fill,
        })),
      },
    ];
  }
}
