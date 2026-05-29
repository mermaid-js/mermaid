import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { getConfig as getConfigAPI } from '../../config.js';
import { cleanAndMerge } from '../../utils.js';
import { getThemeVariables } from '../../themes/theme-default.js';

export const getStyles: DiagramStylesProvider = () => {
  const defaultThemeVars = getThemeVariables();
  const currentConfig = getConfigAPI();
  const themeVariables = cleanAndMerge(defaultThemeVars, currentConfig.themeVariables);

  const boxFill = themeVariables.mainBkg ?? '#ddd';
  const boxStroke = themeVariables.nodeBorder ?? '#666';
  const textColor = themeVariables.textColor ?? '#333';
  const lineColor = themeVariables.lineColor ?? '#555';
  const titleColor = themeVariables.titleColor ?? '#333';

  return `
  .ditaaBox {
    fill: ${boxFill};
    stroke: ${boxStroke};
    stroke-width: 1.5px;
  }
  .ditaaBoxDashed {
    fill: ${boxFill};
    stroke: ${boxStroke};
    stroke-width: 1.5px;
    stroke-dasharray: 6 4;
  }
  .ditaaLine {
    fill: none;
    stroke: ${lineColor};
    stroke-width: 1.5px;
  }
  .ditaaLineDashed {
    fill: none;
    stroke: ${lineColor};
    stroke-width: 1.5px;
    stroke-dasharray: 6 4;
  }
  .ditaaArrow {
    fill: none;
    stroke: ${lineColor};
    stroke-width: 1.5px;
  }
  .ditaaArrowHead {
    fill: ${lineColor};
    stroke: none;
  }
  .ditaaText {
    fill: ${textColor};
    font-family: monospace;
    font-size: 13px;
    dominant-baseline: middle;
  }
  .ditaaBoxText {
    fill: ${textColor};
    font-family: monospace;
    font-size: 13px;
    text-anchor: middle;
    dominant-baseline: middle;
  }
  .ditaaTitle {
    fill: ${titleColor};
    font-family: sans-serif;
    font-size: 16px;
    font-weight: bold;
    text-anchor: middle;
  }
  `;
};

export default getStyles;
