import { XYChartAxisConfig } from '../../../../../config.type.js';
import {
    AxisDataType,
    ChartComponent,
    isBandAxisData,
} from '../../Interfaces.js';
import { TextDimensionCalculatorWithFont } from '../../TextDimensionCalculator.js';
import { BandAxis } from './BandAxis.js';
import { LinearAxis } from './LinearAxis.js';

export type AxisPosition = 'left' | 'right' | 'top' | 'bottom';

export interface IAxis extends ChartComponent {
  getScaleValue(value: string | number): number;
  setAxisPosition(axisPosition: AxisPosition): void;
  getTickInnerPadding(): number;
  getTickDistance(): number;
  setRange(range: [number, number]): void;
}

export function getAxis(data: AxisDataType, axisConfig: XYChartAxisConfig, fontFamily?: string): IAxis {
  const textDimansionCalculator = new TextDimensionCalculatorWithFont(fontFamily);
  if (isBandAxisData(data)) {
    return new BandAxis(axisConfig, data.categories, data.title, textDimansionCalculator);
  }
  return new LinearAxis(axisConfig, [data.min, data.max], data.title, textDimansionCalculator);
}
