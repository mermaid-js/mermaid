import { ScaleBand, scaleBand } from 'd3';
import { XYChartAxisConfig } from '../../../../../config.type.js';
import { log } from '../../../../../logger.js';
import { ITextDimensionCalculator } from '../../TextDimensionCalculator.js';
import { BaseAxis } from './BaseAxis.js';

export class BandAxis extends BaseAxis {
  private scale: ScaleBand<string>;
  private categories: string[];

  constructor(
    axisConfig: XYChartAxisConfig,
    categories: string[],
    title: string,
    textDimensionCalculator: ITextDimensionCalculator
  ) {
    super(axisConfig, title, textDimensionCalculator);
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
