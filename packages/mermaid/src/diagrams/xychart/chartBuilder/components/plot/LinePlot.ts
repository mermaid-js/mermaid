import { line } from 'd3';
import { DrawableElem, LinePlotData, OrientationEnum } from '../../Interfaces.js';
import { IAxis } from '../axis/index.js';

export class LinePlot {
  constructor(
    private plotData: LinePlotData,
    private xAxis: IAxis,
    private yAxis: IAxis,
    private orientation: OrientationEnum
  ) {}

  getDrawableElement(): DrawableElem[] {
    const finalData: [number, number][] = this.plotData.data.map((d) => [
      this.xAxis.getScaleValue(d[0]),
      this.yAxis.getScaleValue(d[1]),
    ]);

    let path: string | null;
    if (this.orientation === OrientationEnum.HORIZONTAL) {
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
    return [
      {
        groupTexts: ['plot', 'line-plot'],
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
  }
}
