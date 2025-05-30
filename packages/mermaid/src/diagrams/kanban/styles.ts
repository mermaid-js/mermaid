// @ts-expect-error Incorrect khroma types
import { darken, lighten, isDark } from 'khroma';
import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { getIconStyles } from '../globalStyles.js';

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

  const adjuster = (color: string, level: number) =>
    options.darkMode ? darken(color, level) : lighten(color, level);

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    const sw = '' + (17 - 3 * i);
    sections += `
    .section-${i - 1} rect, .section-${i - 1} path, .section-${i - 1} circle, .section-${
      i - 1
    } polygon, .section-${i - 1} path  {
      fill: ${adjuster(options['cScale' + i], 10)};
      stroke: ${adjuster(options['cScale' + i], 10)};

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

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${options.background};
    stroke: ${options.nodeBorder};
    stroke-width: 1px;
  }

  .kanban-ticket-link {
    fill: ${options.background};
    stroke: ${options.nodeBorder};
    text-decoration: underline;
  }
    `;
  }
  return sections;
};

// TODO: These options seem incorrect.
const getStyles: DiagramStylesProvider = (options) =>
  `
  .edge {
    stroke-width: 3;
  }
  ${genSections(options)}
  .section-root rect, .section-root path, .section-root circle, .section-root polygon  {
    fill: ${options.git0};
  }
  .section-root text {
    fill: ${options.gitBranchLabel0};
  }
  .icon-container {
    height:100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .edge {
    fill: none;
  }
  .cluster-label, .label {
    color: ${options.textColor};
    fill: ${options.textColor};
    }
  .kanban-label {
    dy: 1em;
    alignment-baseline: middle;
    text-anchor: middle;
    dominant-baseline: middle;
    text-align: center;
  }
    ${getIconStyles()}
`;
export default getStyles;
