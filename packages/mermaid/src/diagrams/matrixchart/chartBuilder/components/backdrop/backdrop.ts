import type {
  BackdropData,
  BoundingRect,
  DrawableElem,
  MatrixChartConfig,
} from '../../interfaces.js';
import type { Axis } from '../axis/index.js';

export class Backdrop {
  constructor(
    private barData: BackdropData,
    private boundingRect: BoundingRect,
    private orientation: MatrixChartConfig['chartOrientation'],
    private plotIndex: string,
    private xAxis?: Axis,
    private yAxis?: Axis
  ) {}

  getDrawableElement(): DrawableElem[] {
    if (!(this.xAxis && this.yAxis)) {
      throw Error('Axes must be passed to render Plots');
    }
    const finalData: [number, number][] = this.barData.data.map((d) => {
      if (this.xAxis && this.yAxis) {
        return [this.xAxis.getScaleValue(d[0]), this.yAxis.getScaleValue(d[1])];
      } else {
        return [0, 0];
      }
    });

    const barPaddingPercent = 0.05;

    const barWidth = this.yAxis.getBandwidth();
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
            width: barWidth,
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
          y: data[1] - barWidthHalf,
          width: barWidth,
          height: barWidth,
          fill: this.barData.fill,
          strokeWidth: 0,
          strokeFill: this.barData.fill,
        })),
      },
    ];
  }
}
