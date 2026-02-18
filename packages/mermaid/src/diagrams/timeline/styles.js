import { darken, lighten, isDark } from 'khroma';
import * as configApi from '../../config.js';

const genReduxSections = (options) => {
  const config = configApi.getConfig();
  const { theme, themeVariables } = config;
  const { borderColorArray } = themeVariables;
  const isDark = theme?.includes('dark');
  const isColor = theme?.includes('color');

  let sections = '';

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    const sw = `${17 - 3 * i}`;
    const color = isColor ? borderColorArray[i] : options.mainBkg;
    const stroke = isColor ? borderColorArray[i] : options.nodeBorder;

    sections += `
    .section-${i - 1} rect,
    .section-${i - 1} path,
    .section-${i - 1} circle {
      fill: ${isDark && isColor ? options.mainBkg : color};
      stroke: ${stroke};
      stroke-width: ${options.strokeWidth};
      filter: ${options.dropShadow};
    }

    .section-${i - 1} text {
      fill: ${options.nodeBorder};
      font-weight: ${options.fontWeight}
    }

    .node-icon-${i - 1} {
      font-size: 40px;
      color: ${options['cScaleLabel' + i]};
    }

    .section-edge-${i - 1} {
      stroke: ${options['cScale' + i]};
    }

    .edge-depth-${i - 1} {
      stroke-width: ${sw};
    }

    .section-${i - 1} line {
      stroke: ${options['cScaleInv' + i]};
      stroke-width: 3;
    }

    .lineWrapper line {
      stroke: ${options.nodeBorder};
      stroke-width:${options.strokeWidth}
    }

    .disabled,
    .disabled circle,
    .disabled text {
      fill: lightgray;
    }

    .disabled text {
      fill: #efefef;
    }
    `;
  }

  return sections;
};

const genSections = (options) => {
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
    } path  {
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

    .lineWrapper line{
      stroke: ${options['cScaleLabel' + i]} ;
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

const getStyles = (options) => {
  const config = configApi.getConfig();
  const { theme } = config;
  return `
  .edge {
    stroke-width: 3;
  }
  ${theme?.includes('redux') ? genReduxSections(options) : genSections(options)}
  .section-root rect, .section-root path, .section-root circle  {
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
  .eventWrapper  {
   filter: brightness(120%);
  }
`;
};
export default getStyles;
