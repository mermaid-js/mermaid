import type { BarPlotData, BoundingRect, DrawableElem, XYChartConfig } from '../../interfaces.js';
import type { Axis } from '../axis/index.js';

export class BarPlot {
  constructor(
    private barData: BarPlotData[],
    private boundingRect: BoundingRect,
    private xAxis: Axis,
    private yAxis: Axis,
    private orientation: XYChartConfig['chartOrientation'],
    private plotIndex: number
  ) {}

  getDrawableElement(): DrawableElem[] {
    const offset = new Array(this.barData[0].data.length).fill(0);
    return this.barData.map((barData, dataIndex) => {
      const finalData: [number, number][] = barData.data.map((d) => [
        this.xAxis.getScaleValue(d[0]),
        this.yAxis.getScaleValue(d[1]),
      ]);
  
      const barPaddingPercent = 0.05;

      const barWidth =
        Math.min(this.xAxis.getAxisOuterPadding() * 2, this.xAxis.getTickDistance()) *
        (1 - barPaddingPercent);
      const barWidthHalf = barWidth / 2;
  
      if (this.orientation === 'horizontal') {
        return {
            groupTexts: ['plot', `bar-plot-${this.plotIndex}-${dataIndex}`],
            type: 'rect',
            data: finalData.map((data, index) => {
              const x = offset[index] + this.boundingRect.x;
              const width = data[1] - this.boundingRect.x;
              offset[index] += width;
              return {
                x,
                y: data[0] - barWidthHalf,
                height: barWidth,
                width,
                fill: barData.fill,
                strokeWidth: 0,
                strokeFill: barData.fill,
              }              
            }),
          };
      }
      return {
          groupTexts: ['plot', `bar-plot-${this.plotIndex}-${dataIndex}`],
          type: 'rect',
          data: finalData.map((data, index) => {
            const y = data[1] - offset[index];
            const height = this.boundingRect.y + this.boundingRect.height - data[1];
            offset[index] += height;
            return {
              x: data[0] - barWidthHalf,
              y,
              width: barWidth,
              height,
              fill: barData.fill,
              strokeWidth: 0,
              strokeFill: barData.fill,
            };
          }),
        };
      });
  }
}
