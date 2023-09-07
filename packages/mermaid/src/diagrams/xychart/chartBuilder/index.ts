import type { SVGGType } from '../xychartDb.js';
import type { DrawableElem, XYChartConfig, XYChartData, XYChartThemeConfig } from './interfaces.js';
import { Orchestrator } from './orchestrator.js';

export class XYChartBuilder {
  static build(
    config: XYChartConfig,
    chartData: XYChartData,
    chartThemeConfig: XYChartThemeConfig,
    tmpSVGGElem: SVGGType
  ): DrawableElem[] {
    const orchestrator = new Orchestrator(config, chartData, chartThemeConfig, tmpSVGGElem);
    return orchestrator.getDrawableElement();
  }
}
