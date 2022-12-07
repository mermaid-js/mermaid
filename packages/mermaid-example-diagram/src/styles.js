const genSections = (options) => {
  let sections = '';

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    sections += `
    .section-${i} rect  {
      fill: ${options['cScale' + i]};
      stroke: ${options['cScalePeer' + i]};
      stroke-width: 4;
    }
    .section-${i} rect.inverted  {
      fill: ${options['cScaleInv' + i]};
    }
    .section-${i} text {
     fill: ${options['cScaleLabel' + i]};
    }

    `;
  }
  return sections;
};

const getStyles = (options) =>
  `
  ${genSections(options)}
`;
export default getStyles;
