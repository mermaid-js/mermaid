import { Dimension, DrawableElem, OrientationEnum, Point } from '../Interfaces.js';

export interface ChartComponent {
  calculateSpace(availableSpace: Dimension): Dimension;
  setBoundingBoxXY(point: Point): void;
  getDrawableElements(): DrawableElem[];
}
