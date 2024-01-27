import type { Group } from '../../../diagram-api/types.js';
import type { DrawableElem, XYChartConfig, XYChartData, XYChartThemeConfig } from './interfaces.js';
import { Orchestrator } from './orchestrator.js';

export class XYChartBuilder {
  static build(
    config: XYChartConfig,
    chartData: XYChartData,
    chartThemeConfig: XYChartThemeConfig,
    tmpSVGGroup: Group
  ): DrawableElem[] {
    const orchestrator = new Orchestrator(config, chartData, chartThemeConfig, tmpSVGGroup);
    return orchestrator.getDrawableElement();
  }
}
