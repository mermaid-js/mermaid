const genSections = (options) => {
  let sections = '';
  for (let i = 1; i < 8; i++) {
    const sw = '' + (17 - 3 * i);
    sections += `
    .section-${i - 1} rect {
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
  .section-root rect {
    fill: ${options.git0};
  }
  .section-root text {
    fill: ${options.gitBranchLabel0};
  }

`;
export default getStyles;
