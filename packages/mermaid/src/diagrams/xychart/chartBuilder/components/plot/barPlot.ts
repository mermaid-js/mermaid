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
      return [
        {
          groupTexts: ['plot', `bar-plot-${this.plotIndex}`],
          type: 'rect',
          data: finalData.map((data) => ({
            x: this.boundingRect.x,
            y: data[0] - barWidthHalf,
            height: barWidth,
            width: data[1] - this.boundingRect.x,
            fill: this.barData.fill,
            strokeWidth: 0,
            strokeFill: this.barData.fill,
          })),
        },
      ];
    }
    return [
      {
        groupTexts: ['plot', `bar-plot-${this.plotIndex}`],
        type: 'rect',
        data: finalData.map((data) => ({
          x: data[0] - barWidthHalf,
          y: data[1],
          width: barWidth,
          height: this.boundingRect.y + this.boundingRect.height - data[1],
          fill: this.barData.fill,
          strokeWidth: 0,
          strokeFill: this.barData.fill,
        })),
      },
    ];
  }
}
