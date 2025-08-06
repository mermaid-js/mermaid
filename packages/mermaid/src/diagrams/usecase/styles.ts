import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { UsecaseStyleOptions } from './types.js';

const defaultUsecaseStyleOptions: UsecaseStyleOptions = {
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
  usecase,
}: { usecase?: UsecaseStyleOptions } = {}) => {
  const options = cleanAndMerge(defaultUsecaseStyleOptions, usecase);

  return `
  .usecaseNode.section {
    stroke: ${options.sectionStrokeColor};
    stroke-width: ${options.sectionStrokeWidth};
    fill: ${options.sectionFillColor};
  }
  .usecaseNode.leaf {
    stroke: ${options.leafStrokeColor};
    stroke-width: ${options.leafStrokeWidth};
    fill: ${options.leafFillColor};
  }
  .usecaseLabel {
    fill: ${options.labelColor};
    font-size: ${options.labelFontSize};
  }
  .usecaseValue {
    fill: ${options.valueColor};
    font-size: ${options.valueFontSize};
  }
  .usecaseTitle {
    fill: ${options.titleColor};
    font-size: ${options.titleFontSize};
  }
  `;
};

export default getStyles;
