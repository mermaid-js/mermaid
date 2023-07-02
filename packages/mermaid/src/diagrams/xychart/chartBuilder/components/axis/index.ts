import {
    AxisDataType,
    isBandAxisData,
} from '../../Interfaces.js';
import { TextDimensionCalculator } from '../../TextDimensionCalculator.js';
import { ChartComponent } from '../../Interfaces.js';
import { BandAxis } from './BandAxis.js';
import { LinearAxis } from './LinearAxis.js';
import { XYChartAxisConfig } from '../../../../../config.type.js';

export type AxisPosition = 'left' | 'right' | 'top' | 'bottom';

export interface IAxis extends ChartComponent {
  getScaleValue(value: string | number): number;
  setAxisPosition(axisPosition: AxisPosition): void;
  getTickInnerPadding(): number;
  getTickDistance(): number;
  setRange(range: [number, number]): void;
}

export function getAxis(data: AxisDataType, axisConfig: XYChartAxisConfig): IAxis {
  const textDimansionCalculator = new TextDimensionCalculator();
  if (isBandAxisData(data)) {
    return new BandAxis(axisConfig, data.categories, data.title, textDimansionCalculator);
  }
  return new LinearAxis(axisConfig, [data.min, data.max], data.title, textDimansionCalculator);
}
