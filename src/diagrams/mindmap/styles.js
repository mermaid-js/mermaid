import { darken, lighten, adjust, invert, isDark } from 'khroma';

const genSections = (options) => {
  let sections = '';

  for (let i = 0; i < 8; i++) {
    options['lineColor' + i] = options['lineColor' + i] || options['gitBranchLabel' + i];
    if (isDark(options['lineColor' + i])) {
      options['lineColor' + i] = lighten(options['lineColor' + i], 30);
    } else {
      options['lineColor' + i] = darken(options['lineColor' + i], 30);
    }
  }

  for (let i = 1; i < 8; i++) {
    const sw = '' + (17 - 3 * i);
    sections += `
    .section-${i - 1} rect, .section-${i - 1} path {
      fill: ${options['git' + i]};
    }
    .section-${i - 1} text {
     fill: ${options['gitBranchLabel' + i]};
    }
    .section-edge-${i - 1}{
      stroke: ${options['git' + i]};
    }
    .edge-depth-${i - 1}{
      stroke-width: ${sw};
    }
    .section-${i - 1} line {
      stroke: ${options['lineColor' + i]} ;
      stroke-width: 3;
    }
    `;
  }
  return sections;
};

const getStyles = (options) =>
  `
  .edge {
    stroke-width: 3;
  }
  ${genSections(options)}
  .section-root rect, .section-root path {
    fill: ${options.git0};
  }
  .section-root text {
    fill: ${options.gitBranchLabel0};
  }

`;
export default getStyles;
