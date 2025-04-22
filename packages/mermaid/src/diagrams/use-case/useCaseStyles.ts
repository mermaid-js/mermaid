/* eslint-disable @cspell/spellchecker */
import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import type { UseCaseStyleOptions } from './useCaseTypes.js';

const getStyles: DiagramStylesProvider = (options: UseCaseStyleOptions) => `
  .actor {
    stroke: ${options.actorBorderColor};
    stroke-width: ${options.actorBorderWidth};
    fill: ${options.actorFillColor};
  }
    
  .usecase {
    stroke: ${options.useCaseBorderColor};
    stroke-width: ${options.useCaseBorderWidth};
    fill: ${options.useCaseFillColor};
    rx: 10;
    ry: 10;
  }

  .edge {
    stroke: ${options.edgeColor};
    stroke-width: ${options.edgeWidth};
    fill: none;
  }

  .label {
    font-size: ${options.fontSize};
    fill: ${options.labelColor};
  }
`;

export default getStyles;
