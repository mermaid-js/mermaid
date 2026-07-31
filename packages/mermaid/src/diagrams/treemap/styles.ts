import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { TreemapStyleOptions } from './types.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { getConfig as getConfigAPI } from '../../config.js';

const defaultTreemapStyleOptions: TreemapStyleOptions = {
  sectionStrokeColor: 'black',
  sectionStrokeWidth: '1',
  sectionFillColor: '#efefef',
  leafStrokeColor: 'black',
  leafStrokeWidth: '1',
  leafFillColor: '#efefef',
  labelFontSize: '12px',
  valueFontSize: '10px',
  titleFontSize: '14px',
};

export const getStyles: DiagramStylesProvider = ({
  treemap,
}: { treemap?: TreemapStyleOptions } = {}) => {
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = getConfigAPI();
  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);

  const options = cleanAndMerge(defaultTreemapStyleOptions, treemap);

  const titleColor = options.titleColor ?? themeVariables.titleColor;
  const labelColor = options.labelColor ?? themeVariables.textColor;
  const valueColor = options.valueColor ?? themeVariables.textColor;

  return `
  .treemapNode.section {
    stroke: ${options.sectionStrokeColor};
    stroke-width: ${options.sectionStrokeWidth};
    fill: ${options.sectionFillColor};
  }
  .treemapNode.leaf {
    stroke: ${options.leafStrokeColor};
    stroke-width: ${options.leafStrokeWidth};
    fill: ${options.leafFillColor};
  }
  .treemapLabel {
    fill: ${labelColor};
    font-size: ${options.labelFontSize};
  }
  .treemapValue {
    fill: ${valueColor};
    font-size: ${options.valueFontSize};
  }
  .treemapTitle {
    fill: ${titleColor};
    font-size: ${options.titleFontSize};
  }
  `;
};

export default getStyles;
