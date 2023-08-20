import { log } from '../../../logger.js';
import { SVGGType } from '../xychartDb.js';
import { DrawableElem, XYChartData, XYChartConfig, XYChartThemeConfig } from './Interfaces.js';
import { Orchestrator } from './Orchestrator.js';

export class XYChartBuilder {
  static build(
    config: XYChartConfig,
    chartData: XYChartData,
    chartThemeConfig: XYChartThemeConfig,
    tmpSVGGElem: SVGGType
  ): DrawableElem[] {
    log.trace(`Build start with Config: ${JSON.stringify(config, null, 2)}`);
    log.trace(`Build start with ChartData: ${JSON.stringify(chartData, null, 2)}`);
    log.trace(`Build start with ChartThemeConfig: ${JSON.stringify(chartThemeConfig, null, 2)}`);
    const orchestrator = new Orchestrator(config, chartData, chartThemeConfig, tmpSVGGElem);
    return orchestrator.getDrawableElement();
  }
}
