import type { Group } from '../../../../../diagram-api/types.js';
import type {
  BandAxisDataType,
  ChartComponent,
  MatrixChartAxisConfig,
  MatrixChartAxisThemeConfig,
} from '../../interfaces.js';
import { TextDimensionCalculatorWithFont } from '../../textDimensionCalculator.js';
import { BandAxis } from './bandAxis.js';

export type AxisPosition = 'left' | 'right' | 'top' | 'bottom';

export interface Axis extends ChartComponent {
  getScaleValue(value: string | number): number;
  setAxisPosition(axisPosition: AxisPosition): void;
  getAxisOuterPadding(): number;
  getTickDistance(): number;
  recalculateOuterPaddingToDrawBar(): void;
  setRange(range: [number, number]): void;
  getBandwidth(): number;
}

export function getAxis(
  data: BandAxisDataType,
  axisConfig: MatrixChartAxisConfig,
  axisThemeConfig: MatrixChartAxisThemeConfig,
  tmpSVGGroup: Group
): Axis {
  const textDimansionCalculator = new TextDimensionCalculatorWithFont(tmpSVGGroup);
  return new BandAxis(
    axisConfig,
    axisThemeConfig,
    data.categories,
    data.title,
    textDimansionCalculator
  );
}
