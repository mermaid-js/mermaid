import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import type { ArchitectureStyleOptions } from './architectureTypes.js';
// @ts-expect-error Incorrect khroma types
import { darken, lighten, isDark } from 'khroma';

const genSections: DiagramStylesProvider = (options) => {
  let sections = '';

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    options['lineColor' + i] = options['lineColor' + i] || options['cScaleInv' + i];
    if (isDark(options['lineColor' + i])) {
      options['lineColor' + i] = lighten(options['lineColor' + i], 20);
    } else {
      options['lineColor' + i] = darken(options['lineColor' + i], 20);
    }
  }

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    const sw = '' + (17 - 3 * i);
    sections += `
    .section-${i - 1} rect, .section-${i - 1} path, .section-${i - 1} circle, .section-${
      i - 1
    } polygon, .section-${i - 1} path  {
      fill: ${options['cScale' + i]};
    }
    .section-${i - 1} text {
     fill: ${options['cScaleLabel' + i]};
    }
    .node-icon-${i - 1} {
      font-size: 40px;
      color: ${options['cScaleLabel' + i]};
    }
    .section-edge-${i - 1}{
      stroke: ${options['cScale' + i]};
    }
    .edge-depth-${i - 1}{
      stroke-width: ${sw};
    }
    .section-${i - 1} line {
      stroke: ${options['cScaleInv' + i]} ;
      stroke-width: 3;
    }

    .disabled, .disabled circle, .disabled text {
      fill: lightgray;
    }
    .disabled text {
      fill: #efefef;
    }
    `;
  }
  return sections;
};

const getStyles: DiagramStylesProvider = (options: ArchitectureStyleOptions) =>
  `
  .edge {
    stroke-width: 3;
    stroke: #777;
  }
  .section-root rect, .section-root path, .section-root circle, .section-root polygon  {
    fill: #333;
  }
  .section-root text {
    fill:#333;
  }
  ${genSections(options)}
  .edge {
    fill: none;
  }

  .node-bkg {
    fill: none;
    stroke: #000;
    stroke-width: 2px;
    stroke-dasharray: 8;
  }
`;

export default getStyles;
