import { ScaleBand, scaleBand } from 'd3';
import {
  Dimension,
  Point,
  DrawableElem,
  BoundingRect,
  OrientationEnum,
  XYChartConfig,
} from '../../Interfaces.js';
import { IAxis } from './index.js';

export class BandAxis implements IAxis {
  private scale: ScaleBand<string>;
  private range: [number, number];
  private boundingRect: BoundingRect;
  private orientation: OrientationEnum;
  private categories: string[];

  constructor(private chartConfig: XYChartConfig, categories: string[]) {
    this.range = [0, 10];
    this.categories = categories;
    this.scale = scaleBand().domain(this.categories).range(this.range);
    this.boundingRect = { x: 0, y: 0, width: 0, height: 0 };
    this.orientation = OrientationEnum.VERTICAL;
  }

  setRange(range: [number, number]): void {
    this.range = range;
    this.scale = scaleBand().domain(this.categories).range(this.range);
  }
  setOrientation(orientation: OrientationEnum): void {
    this.orientation = orientation;
  }

  getScaleValue(value: string): number {
    return this.scale(value) || this.range[0];
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
