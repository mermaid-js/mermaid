import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { TreemapStyleOptions } from './types.js';

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
  titleColor: 'black',
  titleFontSize: '14px',
};

export const getStyles: DiagramStylesProvider = ({
  treemap,
}: { treemap?: TreemapStyleOptions } = {}) => {
  const options = cleanAndMerge(defaultTreemapStyleOptions, treemap);

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
