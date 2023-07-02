// @ts-ignore: TODO Fix ts errors
import { XYChartConfig } from '../../../config.type.js';
import { log } from '../../../logger.js';
import {
  DrawableElem,
  XYChartData,
} from './Interfaces.js';
import { Orchestrator } from './Orchestrator.js';

export class XYChartBuilder {

  static build(config: XYChartConfig, chartData: XYChartData): DrawableElem[] {
    log.trace(`Build start with Config: ${JSON.stringify(config, null, 2)}`);
    log.trace(`Build start with ChartData: ${JSON.stringify(chartData, null, 2)}`);
    const orchestrator = new Orchestrator(config, chartData);
    return orchestrator.getDrawableElement();
  }
}
