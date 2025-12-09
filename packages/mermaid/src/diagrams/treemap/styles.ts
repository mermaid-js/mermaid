import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { TreemapStyleOptions } from './types.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { getConfig as getConfigAPI } from '../../config.js';

const defaultTreemapStyleOptions: TreemapStyleOptions = {

  sectionStrokeColor: 'currentColor',
  sectionStrokeWidth: '1',
  sectionFillColor: 'transparent',
  leafStrokeColor: 'currentColor',
  leafStrokeWidth: '1',
  leafFillColor: 'transparent',
  labelColor: 'currentColor',
  labelFontSize: '12px',
  valueFontSize: '10px',
  valueColor: 'currentColor',
  titleColor: 'currentColor',
  titleFontSize: '14px',
};

export const getStyles: DiagramStylesProvider = ({
  treemap,
}: { treemap?: TreemapStyleOptions } = {}) => {
  // Merge theme variables -> treemap theme overrides -> explicit options
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = getConfigAPI();
  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);

  // Map generic theme text colors into treemap defaults
  const themeMappedDefaults: TreemapStyleOptions = {
    titleColor: themeVariables.titleColor,
    labelColor: themeVariables.textColor,
    valueColor: themeVariables.textColor,
  };

  const options = cleanAndMerge(
    cleanAndMerge(defaultTreemapStyleOptions, themeMappedDefaults),
    cleanAndMerge((themeVariables as any).treemap ?? {}, treemap)
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
