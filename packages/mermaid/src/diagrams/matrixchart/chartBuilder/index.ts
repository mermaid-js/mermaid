import type { Group } from '../../../diagram-api/types.js';
import type {
  DrawableElem,
  MatrixChartConfig,
  MatrixChartData,
  MatrixChartThemeConfig,
} from './interfaces.js';
import { Orchestrator } from './orchestrator.js';

export class MatrixChartBuilder {
  static build(
    config: MatrixChartConfig,
    chartData: MatrixChartData,
    chartThemeConfig: MatrixChartThemeConfig,
    tmpSVGGroup: Group
  ): DrawableElem[] {
    const orchestrator = new Orchestrator(config, chartData, chartThemeConfig, tmpSVGGroup);
    return orchestrator.getDrawableElement();
  }
}
