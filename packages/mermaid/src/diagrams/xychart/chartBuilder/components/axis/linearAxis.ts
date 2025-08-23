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
    // 👇 Add this
    const shouldForceZero = this.axisConfig.forceZeroYStart ?? false;

    let domain: [number, number];
    if (shouldForceZero) {
      domain = [
        Math.min(0, this.domain[0]), // Always start at 0 if needed
        this.domain[1],
      ];
    } else {
      domain = [...this.domain]; // Normal behavior for all other charts
    }

    if (this.axisPosition === 'left') {
      domain.reverse(); // since y-axis in svg starts from top
    }

    this.scale = scaleLinear().domain(domain).range(this.getRange());
  }
  getScaleValue(value: number): number {
    return Math.floor(this.scale(value)); // or Math.round
  }
}
