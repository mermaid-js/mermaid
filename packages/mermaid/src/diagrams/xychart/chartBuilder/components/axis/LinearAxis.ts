import type { ScaleLinear } from 'd3';
import { scaleLinear } from 'd3';
import type { TextDimensionCalculator } from '../../textDimensionCalculator.js';
import { BaseAxis } from './baseAxis.js';
import type { XYChartAxisThemeConfig, XYChartAxisConfig } from '../../interfaces.js';

export class LinearAxis extends BaseAxis {
  private scale: ScaleLinear<number, number>;
  private domain: [number, number];

  constructor(
    axisConfig: XYChartAxisConfig,
    axisThemeConfig: XYChartAxisThemeConfig,
    domain: [number, number],
    title: string,
    textDimensionCalculator: TextDimensionCalculator
  ) {
    super(axisConfig, title, textDimensionCalculator, axisThemeConfig);
    this.domain = domain;
    this.scale = scaleLinear().domain(this.domain).range(this.getRange());
  }

  getTickValues(): (string | number)[] {
    return this.scale.ticks();
  }

  recalculateScale(): void {
    const domain = [...this.domain]; // copy the array so if reverse is called two times it should not cancel the reverse effect
    if (this.axisPosition === 'left') {
      domain.reverse(); // since y-axis in svg start from top
    }
    this.scale = scaleLinear().domain(domain).range(this.getRange());
  }

  getScaleValue(value: number): number {
    return this.scale(value);
  }
}
