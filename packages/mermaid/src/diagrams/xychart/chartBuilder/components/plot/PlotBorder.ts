import { XYChartConfig } from '../../../../../config.type.js';
import { BoundingRect, DrawableElem } from '../../Interfaces.js';
export class PlotBorder {
  constructor(
    private boundingRect: BoundingRect,
    private orientation: XYChartConfig['chartOrientation']
  ) {}

  getDrawableElement(): DrawableElem[] {
    const { x, y, width, height } = this.boundingRect;
    if (this.orientation === 'horizontal') {
      return [
        {
          groupTexts: ['plot', 'chart-border'],
          type: 'path',
          data: [
            {
              path: `M ${x},${y} L ${x + width},${y} M ${x + width},${y + height} M ${x},${
                y + height
              } L ${x},${y}`,
              strokeFill: '#000000',
              strokeWidth: 1,
            },
          ],
        },
      ];
    }
    return [
      {
        groupTexts: ['plot', 'chart-border'],
        type: 'path',
        data: [
          {
            path: `M ${x},${y} M ${x + width},${y} M ${x + width},${y + height} L ${x},${
              y + height
            } L ${x},${y}`,
            strokeFill: '#000000',
            strokeWidth: 1,
          },
        ],
      },
    ];
  }
}
