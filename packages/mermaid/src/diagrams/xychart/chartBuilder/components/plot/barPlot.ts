import type { BarPlotData, BoundingRect, DrawableElem, XYChartConfig } from '../../interfaces.js';
import type { Axis } from '../axis/index.js';

export class BarPlot {
  constructor(
    private barData: BarPlotData,
    private boundingRect: BoundingRect,
    private xAxis: Axis,
    private yAxis: Axis,
    private orientation: XYChartConfig['chartOrientation'],
    private plotIndex: number,
    private cumulativeOffsets: number[] = []
  ) {}

  getDrawableElement(): DrawableElem[] {
    const hasOffset = this.cumulativeOffsets.length > 0;

    const finalData: [number, number][] = this.barData.data.map((d, i) => {
      const offset = this.cumulativeOffsets[i] || 0;
      return [this.xAxis.getScaleValue(d[0]), this.yAxis.getScaleValue(d[1] + offset)];
    });

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
          data: finalData.map((data, i) => {
            const baseX = hasOffset
              ? this.yAxis.getScaleValue(this.cumulativeOffsets[i] || 0)
              : this.boundingRect.x;
            return {
              x: baseX,
              y: data[0] - barWidthHalf,
              height: barWidth,
              width: data[1] - baseX,
              fill: this.barData.fill,
              strokeWidth: 0,
              strokeFill: this.barData.fill,
            };
          }),
        },
      ];
    }
    return [
      {
        groupTexts: ['plot', `bar-plot-${this.plotIndex}`],
        type: 'rect',
        data: finalData.map((data, i) => {
          const baseY = hasOffset
            ? this.yAxis.getScaleValue(this.cumulativeOffsets[i] || 0)
            : this.boundingRect.y + this.boundingRect.height;
          return {
            x: data[0] - barWidthHalf,
            y: data[1],
            width: barWidth,
            height: baseY - data[1],
            fill: this.barData.fill,
            strokeWidth: 0,
            strokeFill: this.barData.fill,
          };
        }),
      },
    ];
  }
}
