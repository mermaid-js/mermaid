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
  labelColor: 'black',
  labelFontSize: '12px',
  valueFontSize: '10px',
  valueColor: 'black',
  titleFontSize: '14px',
};

export const getStyles: DiagramStylesProvider = ({
  treemap,
}: { treemap?: TreemapStyleOptions } = {}) => {
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = getConfigAPI();
  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);

  const options = cleanAndMerge(
    { ...defaultTreemapStyleOptions, titleColor: themeVariables.titleColor },
    treemap
  );

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
    fill: ${options.labelColor};
    font-size: ${options.labelFontSize};
  }
  .treemapValue {
    fill: ${options.valueColor};
    font-size: ${options.valueFontSize};
  }
  .treemapTitle {
    fill: ${options.titleColor};
    font-size: ${options.titleFontSize};
  }
  `;
};

export default getStyles;
