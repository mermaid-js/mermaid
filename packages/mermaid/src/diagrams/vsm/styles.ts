import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { cleanAndMerge } from '../../utils.js';
import { getConfig as getConfigAPI } from '../../config.js';
import type { VsmStyleOptions } from './types.js';

export const styles: DiagramStylesProvider = (options?: { vsm?: VsmStyleOptions }) => {
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = getConfigAPI();
  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);

  const vsmDefaults: VsmStyleOptions = {
    stepFill: themeVariables.primaryColor,
    stepStroke: themeVariables.primaryBorderColor,
    stepTextColor: themeVariables.primaryTextColor,
    queueFill: themeVariables.secondaryColor,
    queueStroke: themeVariables.secondaryBorderColor,
    endpointFill: themeVariables.tertiaryColor,
    endpointStroke: themeVariables.tertiaryBorderColor,
    timelineBg: themeVariables.background,
    arrowColor: themeVariables.lineColor,
    fontSize: 12,
  };

  const vsmOptions: VsmStyleOptions = cleanAndMerge(vsmDefaults, options?.vsm);

  return `
  .vsm-title {
    font-size: ${themeVariables.fontSize};
    font-weight: bold;
    fill: ${themeVariables.titleColor};
  }
  .vsm-step {
    fill: ${vsmOptions.stepFill};
    stroke: ${vsmOptions.stepStroke};
    stroke-width: 2;
  }
  .vsm-step-title {
    font-size: ${vsmOptions.fontSize! + 2}px;
    font-weight: bold;
    fill: ${vsmOptions.stepTextColor};
  }
  .vsm-data-box {
    fill: ${themeVariables.background};
    stroke: ${vsmOptions.stepStroke};
    stroke-width: 1;
  }
  .vsm-data-label {
    font-size: ${vsmOptions.fontSize}px;
    font-weight: bold;
    fill: ${themeVariables.textColor};
  }
  .vsm-data-value {
    font-size: ${vsmOptions.fontSize}px;
    fill: ${themeVariables.textColor};
  }
  .vsm-data-divider {
    stroke: ${vsmOptions.stepStroke};
    stroke-width: 0.5;
    stroke-opacity: 0.3;
  }
  .vsm-endpoint {
    fill: ${vsmOptions.endpointFill};
    stroke: ${vsmOptions.endpointStroke};
    stroke-width: 2;
  }
  .vsm-endpoint-text {
    font-size: ${vsmOptions.fontSize}px;
    fill: ${themeVariables.primaryTextColor};
  }
  .vsm-queue {
    stroke: ${vsmOptions.queueStroke};
    stroke-width: 2;
  }
  .vsm-queue-line {
    stroke: ${vsmOptions.queueStroke};
  }
  .vsm-arrow {
    stroke: ${vsmOptions.arrowColor};
    stroke-width: 2;
  }
  .vsm-arrowhead {
    fill: ${vsmOptions.arrowColor};
  }
  .vsm-timeline-line {
    stroke: ${vsmOptions.arrowColor};
    stroke-width: 1;
    stroke-dasharray: 4 2;
  }
  .vsm-timeline-queue {
    font-size: ${vsmOptions.fontSize! - 1}px;
    fill: ${themeVariables.textColor};
  }
  .vsm-timeline-process {
    font-size: ${vsmOptions.fontSize! - 1}px;
    fill: ${themeVariables.textColor};
  }
  .vsm-summary-label {
    font-size: ${vsmOptions.fontSize! + 1}px;
    font-weight: bold;
    fill: ${themeVariables.textColor};
  }
  .vsm-summary-value {
    font-size: ${vsmOptions.fontSize! + 1}px;
    fill: ${themeVariables.textColor};
  }
  `;
};

export default styles;
