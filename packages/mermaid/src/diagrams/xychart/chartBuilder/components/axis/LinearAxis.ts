import { ScaleLinear, scaleLinear } from 'd3';
import { XYChartAxisConfig } from '../../../../../config.type.js';
import { log } from '../../../../../logger.js';
import { ITextDimensionCalculator } from '../../TextDimensionCalculator.js';
import { BaseAxis } from './BaseAxis.js';
import { XYChartAxisThemeConfig } from '../../Interfaces.js';

export class LinearAxis extends BaseAxis {
  private scale: ScaleLinear<number, number>;
  private domain: [number, number];

  constructor(
    axisConfig: XYChartAxisConfig,
    axisThemeConfig: XYChartAxisThemeConfig,
    domain: [number, number],
    title: string,
    textDimensionCalculator: ITextDimensionCalculator
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
    log.trace('Linear axis final domain, range: ', this.domain, this.getRange());
  }

  getScaleValue(value: number): number {
    return this.scale(value);
  }
}
