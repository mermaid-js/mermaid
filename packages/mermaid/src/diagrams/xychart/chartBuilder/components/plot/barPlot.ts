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
    private stackedBaseValues: number[] = []
  ) {}

  getDrawableElement(): DrawableElem[] {
    const barPaddingPercent = 0.05;

    const barWidth =
      Math.min(this.xAxis.getAxisOuterPadding() * 2, this.xAxis.getTickDistance()) *
      (1 - barPaddingPercent);
    const barWidthHalf = barWidth / 2;

    const isStacked = this.stackedBaseValues.length > 0;

    if (this.orientation === 'horizontal') {
      return [
        {
          groupTexts: ['plot', `bar-plot-${this.plotIndex}`],
          type: 'rect',
          data: this.barData.data.map((d, index) => {
            const scaledCategory = this.xAxis.getScaleValue(d[0]);
            const scaledValue = this.yAxis.getScaleValue(d[1]);

            if (isStacked) {
              const scaledBase = this.yAxis.getScaleValue(this.stackedBaseValues[index]);
              const scaledTop = this.yAxis.getScaleValue(this.stackedBaseValues[index] + d[1]);
              return {
                x: scaledBase,
                y: scaledCategory - barWidthHalf,
                height: barWidth,
                width: scaledTop - scaledBase,
                fill: this.barData.fill,
                strokeWidth: 0,
                strokeFill: this.barData.fill,
              };
            }

            // Original non-stacked behavior
            return {
              x: this.boundingRect.x,
              y: scaledCategory - barWidthHalf,
              height: barWidth,
              width: scaledValue - this.boundingRect.x,
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
        data: this.barData.data.map((d, index) => {
          const scaledCategory = this.xAxis.getScaleValue(d[0]);
          const scaledValue = this.yAxis.getScaleValue(d[1]);

          if (isStacked) {
            const scaledBarBase = this.yAxis.getScaleValue(this.stackedBaseValues[index]);
            const scaledBarTop = this.yAxis.getScaleValue(this.stackedBaseValues[index] + d[1]);
            return {
              x: scaledCategory - barWidthHalf,
              y: scaledBarTop,
              width: barWidth,
              height: scaledBarBase - scaledBarTop,
              fill: this.barData.fill,
              strokeWidth: 0,
              strokeFill: this.barData.fill,
            };
          }

          // Original non-stacked behavior
          return {
            x: scaledCategory - barWidthHalf,
            y: scaledValue,
            width: barWidth,
            height: this.boundingRect.y + this.boundingRect.height - scaledValue,
            fill: this.barData.fill,
            strokeWidth: 0,
            strokeFill: this.barData.fill,
          };
        }),
      },
    ];
  }
}
