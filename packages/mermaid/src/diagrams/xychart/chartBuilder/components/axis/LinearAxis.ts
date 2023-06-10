import { ScaleLinear, scaleLinear } from 'd3';
import { AxisConfig, Dimension } from '../../Interfaces.js';
import { ITextDimensionCalculator } from '../../TextDimensionCalculator.js';
import { BaseAxis } from './BaseAxis.js';
import { log } from '../../../../../logger.js';

export class LinearAxis extends BaseAxis {
  private scale: ScaleLinear<number, number>;
  private domain: [number, number];

  constructor(
    axisConfig: AxisConfig,
    domain: [number, number],
    title: string,
    textDimensionCalculator: ITextDimensionCalculator
  ) {
    super(axisConfig, title, textDimensionCalculator);
    this.domain = domain;
    this.scale = scaleLinear().domain(this.domain).range(this.getRange());
  }

  getTickValues(): (string | number)[] {
    return this.scale.ticks();
  }

  recalculateScale(): void {
    if (this.axisPosition === 'left') {
      this.domain.reverse(); // since yaxis in svg start from top
    }
    this.scale = scaleLinear().domain(this.domain).range(this.getRange());
    log.trace('Linear axis final domain, range: ', this.domain, this.getRange());
  }

  getScaleValue(value: number): number {
    return this.scale(value);
  }
}
