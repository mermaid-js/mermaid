import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import type { ArchitectureStyleOptions } from './architectureTypes.js';

const getStyles: DiagramStylesProvider = (options: ArchitectureStyleOptions) =>
  `
  .edge {
    stroke-width: ${options.archEdgeStrokeWidth};
    stroke: ${options.archEdgeStrokeColor};
    fill: none;
  }

  .arrow {
    fill: ${options.archEdgeArrowColor};
  }

  .node-bkg {
    fill: none;
    stroke: ${options.archGroupBorderStrokeColor};
    stroke-width: ${options.archGroupBorderStrokeWidth};
    stroke-dasharray: 8;
  }
`;

export default getStyles;
