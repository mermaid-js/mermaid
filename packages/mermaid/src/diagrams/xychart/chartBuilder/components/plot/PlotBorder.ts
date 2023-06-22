import { BoundingRect, DrawableElem, OrientationEnum } from '../../Interfaces.js';
export class PlotBorder {
  constructor(private boundingRect: BoundingRect, private orientation: OrientationEnum) {}

  getDrawableElement(): DrawableElem[] {
    const {x, y, width, height} = this.boundingRect;
    if(this.orientation === OrientationEnum.HORIZONTAL) {
    return [
      {
        groupTexts: ['plot', 'chart-border'],
        type: 'path',
        data: [
          {
            path: `M ${x},${y} L ${x + width},${y} M ${x + width},${y + height} M ${x},${y + height} L ${x},${y}`,
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
            path: `M ${x},${y} M ${x + width},${y} M ${x + width},${y + height} L ${x},${y + height} L ${x},${y}`,
            strokeFill: '#000000',
            strokeWidth: 1,
          },
        ],
      },
    ];
  }
}
