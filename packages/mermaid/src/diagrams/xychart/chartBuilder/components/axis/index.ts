import {
  AxisDataType,
  BandAxisDataType,
  BoundingRect,
  LinearAxisDataType,
  XYChartConfig,
  XYChartData,
} from '../../Interfaces.js';
import { ChartComponent } from '../Interfaces.js';
import { BandAxis } from './BandAxis.js';
import { LinearAxis } from './LinearAxis.js';

export interface IAxis extends ChartComponent {
  getScaleValue(value: string | number): number;
  setRange(range: [number, number]): void;
}

function isLinearAxisData(data: any): data is LinearAxisDataType {
  return !(Number.isNaN(data.min) || Number.isNaN(data.max));
}

function isBandAxisData(data: any): data is BandAxisDataType {
  return data.categories && Array.isArray(data.categories);
}

export function getAxis(data: AxisDataType, chartConfig: XYChartConfig): IAxis {
  if (isBandAxisData(data)) {
    return new BandAxis(chartConfig, data.categories);
  }
  return new LinearAxis(chartConfig, [data.min, data.max]);
}
