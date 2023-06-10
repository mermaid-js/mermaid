import { BoundingRect, DrawableElem } from '../../Interfaces.js';
export class PlotBorder {
  constructor(private boundingRect: BoundingRect) {}

  getDrawableElement(): DrawableElem[] {
    const {x, y, width, height} = this.boundingRect;
    return [
      {
        groupTexts: ['plot', 'chart-border'],
        type: 'path',
        data: [
          {
            path: `M ${x},${y} L ${x + width},${y} L ${x + width},${y + height} L ${x},${y + height} L ${x},${y}`,
            strokeFill: '#000000',
            strokeWidth: 1,
          },
        ],
      },
    ];
  }
}
