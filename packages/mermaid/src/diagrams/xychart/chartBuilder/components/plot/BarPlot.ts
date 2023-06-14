import { line } from 'd3';
import { BoundingRect, DrawableElem, SimplePlotDataType } from '../../Interfaces.js';
import { IAxis } from '../axis/index.js';

export class BarPlot {
  constructor(
    private data: SimplePlotDataType,
    private boundingRect: BoundingRect,
    private xAxis: IAxis,
    private yAxis: IAxis
  ) {}

  getDrawableElement(): DrawableElem[] {
    const finalData: [number, number][] = this.data.map((d) => [
      this.xAxis.getScaleValue(d[0]),
      this.yAxis.getScaleValue(d[1]),
    ]);

    const barPaddingPercent = 5;

    const barWidth = this.xAxis.getTickInnerPadding() * (1 - barPaddingPercent / 100);
    const barWidthHalf = barWidth / 2;

    return [
      {
        groupTexts: ['plot', 'bar-plot'],
        type: 'rect',
        data: finalData.map((data) => ({
          x: data[0] - barWidthHalf,
          y: data[1],
          width: barWidth,
          height: this.boundingRect.y + this.boundingRect.height - data[1],
          fill: '#ff0000',
          strokeWidth: 0,
          strokeFill: '#0000ff',
        })),
      },
    ];
  }
}
