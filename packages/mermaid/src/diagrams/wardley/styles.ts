import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { getConfig as getConfigAPI } from '../../config.js';

export interface WardleyStyleOptions {
  backgroundColor?: string;
  axisColor?: string;
  axisTextColor?: string;
  gridColor?: string;
  componentFill?: string;
  componentStroke?: string;
  componentLabelColor?: string;
  linkStroke?: string;
  evolutionStroke?: string;
  annotationStroke?: string;
  annotationTextColor?: string;
  annotationFill?: string;
}

export const styles: DiagramStylesProvider = ({
  wardley,
}: { wardley?: WardleyStyleOptions } = {}) => {
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = getConfigAPI();
  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);
  const w: WardleyStyleOptions = cleanAndMerge(themeVariables.wardley, wardley);

  return `
  .wardley-background {
    fill: ${w.backgroundColor};
  }
  .wardley-axes line, .wardley-axes path {
    stroke: ${w.axisColor};
  }
  .wardley-axis-label {
    fill: ${w.axisTextColor};
  }
  .wardley-stage-label {
    fill: ${w.axisTextColor};
  }
  .wardley-grid line {
    stroke: ${w.gridColor};
  }
  .wardley-node circle {
    fill: ${w.componentFill};
    stroke: ${w.componentStroke};
  }
  .wardley-node-label {
    fill: ${w.componentLabelColor};
  }
  .wardley-link {
    stroke: ${w.linkStroke};
  }
  .wardley-link--dashed {
    stroke-dasharray: 4 4;
  }
  .wardley-link-label {
    fill: ${w.axisTextColor};
  }
  .wardley-trend line {
    stroke: ${w.evolutionStroke};
  }
  .wardley-annotation-line {
    stroke: ${w.annotationStroke};
  }
  .wardley-annotation circle {
    fill: ${w.annotationFill};
    stroke: ${w.annotationStroke};
  }
  .wardley-annotation text {
    fill: ${w.annotationTextColor};
  }
  .wardley-annotations-box rect {
    fill: ${w.annotationFill};
    stroke: ${w.annotationStroke};
  }
  .wardley-annotations-box text {
    fill: ${w.annotationTextColor};
  }
  .wardley-pipeline-box {
    stroke: ${w.componentStroke};
  }
  .wardley-notes text {
    fill: ${w.axisTextColor};
  }
  `;
};

export default styles;
