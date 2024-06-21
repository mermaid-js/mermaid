import type { BarPlotData, BoundingRect, DrawableElem, XYChartConfig } from '../../interfaces.js';
import type { Axis } from '../axis/index.js';

export class BarPlot {
  constructor(
    private barDataArr: BarPlotData[],
    private boundingRect: BoundingRect,
    private xAxis: Axis,
    private yAxis: Axis,
    private orientation: XYChartConfig['chartOrientation'],
    private plotIndex: number
  ) {}

  getDrawableElement(): DrawableElem[] {
    const result: DrawableElem[] = [];
    this.barDataArr.reduce<{ positiveBase: number[]; negativeBase: number[] }>(
      (acc, barData, dataIndex) => {
        const barPaddingPercent = 0.05;

        const barWidth =
          Math.min(this.xAxis.getAxisOuterPadding() * 2, this.xAxis.getTickDistance()) *
          (1 - barPaddingPercent);
        const barWidthHalf = barWidth / 2;

        if (this.orientation === 'horizontal') {
          result.push({
            groupTexts: ['plot', `bar-plot-${this.plotIndex}-${dataIndex}`],
            type: 'rect',
            data: barData.data.map((data, i) => {
              const scaledX = this.xAxis.getScaleValue(data[0]);
              const scaledY = this.yAxis.getScaleValue(data[1]);
              const basePoint = this.yAxis.isZeroBasedDomain()
                ? this.yAxis.getScaleValue(0)
                : this.boundingRect.x;
              const width = Math.abs(basePoint - scaledY);
              let widthAdjusted = 0;
              const isPositive = data[1] >= 0;
              if (isPositive) {
                widthAdjusted = acc.positiveBase[i] || 0;
                acc.positiveBase[i] = widthAdjusted + width;
              } else {
                widthAdjusted = acc.negativeBase[i] || 0;
                acc.negativeBase[i] = widthAdjusted + width;
              }
              return {
                x: isPositive ? basePoint + widthAdjusted : basePoint - widthAdjusted - width,
                y: scaledX - barWidthHalf,
                height: barWidth,
                width,
                fill: barData.fill,
                strokeWidth: 0,
                strokeFill: barData.fill,
              };
            }),
          });
        } else {
          result.push({
            groupTexts: ['plot', `bar-plot-${this.plotIndex}-${dataIndex}`],
            type: 'rect',
            data: barData.data.map((data, i) => {
              const scaledX = this.xAxis.getScaleValue(data[0]);
              const scaledY = this.yAxis.getScaleValue(data[1]);
              const basePoint = this.yAxis.isZeroBasedDomain()
                ? this.yAxis.getScaleValue(0)
                : this.boundingRect.y + this.boundingRect.height;
              const height = Math.abs(basePoint - scaledY);
              let heightAdjusted = 0;
              const isPositive = data[1] >= 0;
              if (isPositive) {
                heightAdjusted = acc.positiveBase[i] || 0;
                acc.positiveBase[i] = heightAdjusted + height;
              } else {
                heightAdjusted = acc.negativeBase[i] || 0;
                acc.negativeBase[i] = heightAdjusted + height;
              }
              return {
                x: scaledX - barWidthHalf,
                y: isPositive ? scaledY - heightAdjusted : basePoint + heightAdjusted,
                width: barWidth,
                height,
                fill: barData.fill,
                strokeWidth: 0,
                strokeFill: barData.fill,
              };
            }),
          });
        }
        return acc;
      },
      { positiveBase: [], negativeBase: [] }
    );
    return result;
  }
}
