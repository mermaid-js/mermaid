import { scaleLinear, ScaleLinear } from 'd3';
import {
  Dimension,
  Point,
  DrawableElem,
  BoundingRect,
  OrientationEnum,
  XYChartConfig,
} from '../../Interfaces.js';
import { IAxis } from './index.js';

export class LinearAxis implements IAxis {
  private scale: ScaleLinear<number, number>;
  private boundingRect: BoundingRect;
  private orientation: OrientationEnum;
  private domain: [number, number];
  private range: [number, number];

  constructor(private chartConfig: XYChartConfig, domain: [number, number]) {
    this.domain = domain;
    this.range = [0, 10];
    this.scale = scaleLinear().domain(this.domain).range(this.range);
    this.boundingRect = { x: 0, y: 0, width: 0, height: 0 };
    this.orientation = OrientationEnum.VERTICAL;
  }

  setRange(range: [number, number]): void {
    this.range = range;
    this.scale = scaleLinear().domain(this.domain).range(this.range);
  }

  setOrientation(orientation: OrientationEnum): void {
    this.orientation = orientation;
  }

  getScaleValue(value: number): number {
    return this.scale(value);
  }

  calculateSpace(availableSpace: Dimension): Dimension {
    return {
      width: availableSpace.width,
      height: availableSpace.height,
    };
  }

  setBoundingBoxXY(point: Point): void {
    this.boundingRect.x = point.x;
    this.boundingRect.y = point.y;
  }

  getDrawableElements(): DrawableElem[] {
    return [];
  }
}
