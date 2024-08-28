import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import type { ArchitectureStyleOptions } from './architectureTypes.js';

const getStyles: DiagramStylesProvider = (options: ArchitectureStyleOptions) =>
  `
  .edge {
    stroke-width: ${options.archEdgeWidth};
    stroke: ${options.archEdgeColor};
    fill: none;
  }

  .arrow {
    fill: ${options.archEdgeArrowColor};
  }

  .node-bkg {
    fill: none;
    stroke: ${options.archGroupBorderColor};
    stroke-width: ${options.archGroupBorderWidth};
    stroke-dasharray: 8;
  }
  .node-icon-text {
    display: flex; 
    align-items: center;
  }
  
  .node-icon-text > div {
    color: #fff;
    margin: 1px;
    height: fit-content;
    text-align: center;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
  }
`;

export default getStyles;
