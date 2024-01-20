import { line } from 'd3';
import type { DrawableElem, LinePlotData, XYChartConfig } from '../../interfaces.js';
import type { Axis } from '../axis/index.js';

export class LinePlot {
  constructor(
    private plotData: LinePlotData[],
    private xAxis: Axis,
    private yAxis: Axis,
    private orientation: XYChartConfig['chartOrientation'],
    private plotIndex: number
  ) {}

  getDrawableElement(): DrawableElem[] {
    const drawables: DrawableElem[] = [];
    this.plotData.forEach((plotData, dataIndex) => {
      {
        const finalData: [number, number][] = plotData.data.map((d) => [
          this.xAxis.getScaleValue(d[0]),
          this.yAxis.getScaleValue(d[1]),
        ]);

        let path: string | null;
        if (this.orientation === 'horizontal') {
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
        drawables.push({
          groupTexts: ['plot', `line-plot-${this.plotIndex}-${dataIndex}`],
          type: 'path',
          data: [
            {
              path,
              strokeFill: plotData.strokeFill,
              strokeWidth: plotData.strokeWidth,
            },
          ],
        });
      }
    });
    return drawables;
  }
}
