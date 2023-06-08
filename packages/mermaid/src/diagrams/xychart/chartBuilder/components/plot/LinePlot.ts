import { line } from 'd3';
import { DrawableElem, SimplePlotDataType } from '../../Interfaces.js';
import { IAxis } from '../axis/index.js';

export class LinePlot {
  constructor(private data: SimplePlotDataType, private xAxis: IAxis, private yAxis: IAxis) {}

  getDrawableElement(): DrawableElem[] {
    const finalData: [number, number][] = this.data.map((d) => [
      this.xAxis.getScaleValue(d[0]),
      this.yAxis.getScaleValue(d[1]),
    ]);

    const path = line()
      .x((d) => d[0])
      .y((d) => d[1])(finalData);
    if (!path) {
      return [];
    }
    return [
      {
        groupText: 'line-plot',
        type: 'path',
        data: [
          {
            path,
            strokeFill: '#0000ff',
            strokeWidth: 2,
          },
        ],
      },
    ];
  }
}
