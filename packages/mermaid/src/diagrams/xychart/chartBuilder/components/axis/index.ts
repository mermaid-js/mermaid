import {
    AxisConfig,
    AxisDataType,
    BandAxisDataType,
    LinearAxisDataType
} from '../../Interfaces.js';
import { TextDimensionCalculator } from '../../TextDimensionCalculator.js';
import { ChartComponent } from '../../Interfaces.js';
import { BandAxis } from './BandAxis.js';
import { LinearAxis } from './LinearAxis.js';

export type AxisPosition = 'left' | 'bottom' | 'top' | 'bottom';

export interface IAxis extends ChartComponent {
  getScaleValue(value: string | number): number;
  setAxisPosition(axisPosition: AxisPosition): void;
  getTickInnerPadding(): number;
  setRange(range: [number, number]): void;
}

function isLinearAxisData(data: any): data is LinearAxisDataType {
  return !(Number.isNaN(data.min) || Number.isNaN(data.max));
}

function isBandAxisData(data: any): data is BandAxisDataType {
  return data.categories && Array.isArray(data.categories);
}

export function getAxis(data: AxisDataType, axisConfig: AxisConfig): IAxis {
  const textDimansionCalculator = new TextDimensionCalculator();
  if (isBandAxisData(data)) {
    return new BandAxis(axisConfig, data.categories, data.title, textDimansionCalculator);
  }
  return new LinearAxis(axisConfig, [data.min, data.max], data.title, textDimansionCalculator);
}
