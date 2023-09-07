import type { ScaleBand } from 'd3';
import { scaleBand } from 'd3';
import { log } from '../../../../../logger.js';
import type { TextDimensionCalculator } from '../../textDimensionCalculator.js';
import { BaseAxis } from './baseAxis.js';
import type { XYChartAxisThemeConfig, XYChartAxisConfig } from '../../interfaces.js';

export class BandAxis extends BaseAxis {
  private scale: ScaleBand<string>;
  private categories: string[];

  constructor(
    axisConfig: XYChartAxisConfig,
    axisThemeConfig: XYChartAxisThemeConfig,
    categories: string[],
    title: string,
    textDimensionCalculator: TextDimensionCalculator
  ) {
    super(axisConfig, title, textDimensionCalculator, axisThemeConfig);
    this.categories = categories;
    this.scale = scaleBand().domain(this.categories).range(this.getRange());
  }

  setRange(range: [number, number]): void {
    super.setRange(range);
  }

  recalculateScale(): void {
    this.scale = scaleBand()
      .domain(this.categories)
      .range(this.getRange())
      .paddingInner(1)
      .paddingOuter(0)
      .align(0.5);
    log.trace('BandAxis axis final categories, range: ', this.categories, this.getRange());
  }

  getTickValues(): (string | number)[] {
    return this.categories;
  }

  getScaleValue(value: string): number {
    return this.scale(value) || this.getRange()[0];
  }
}
