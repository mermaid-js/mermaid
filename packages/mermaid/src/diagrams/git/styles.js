import * as configApi from '../../config.js';

const genGitGraphGradient = (options) => {
  const { svgId } = options;
  let sections = '';
  if (options.useGradient && svgId) {
    for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
      sections += `
      .label${i}  { fill: ${options.mainBkg}; stroke: url(${svgId}-gradient); stroke-width: ${options.strokeWidth};}
             `;
    }
  }
  return sections;
};

const genColor = (options) => {
  const config = configApi.getConfig();
  const { theme, themeVariables } = config;
  const { borderColorArray } = themeVariables;
  const isReduxTheme = theme?.includes('redux');
  if (theme?.includes('neo')) {
    let sections = '';

    for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
      if (i === 0) {
        sections += `
        .branch-label${i} { fill: ${options.nodeBorder};}
        .commit${i} { stroke: ${options.nodeBorder};   }
        .commit-highlight${i} { stroke: ${options.nodeBorder}; fill: ${options.nodeBorder}; }
        .arrow${i} { stroke: ${options.nodeBorder}; }
        .commit-bullets { fill: ${options.nodeBorder}; }
        .commit-cherry-pick${i} { stroke: ${options.nodeBorder}; }
        ${genGitGraphGradient(options)}`;
      } else {
        sections += `
        .branch-label${i} { fill: ${options['gitBranchLabel' + i]}; }
        .commit${i} { stroke: ${options['git' + i]}; fill: ${options['git' + i]}; }
        .commit-highlight${i} { stroke: ${options['gitInv' + i]}; fill: ${options['gitInv' + i]}; }
        .arrow${i} { stroke: ${options['git' + i]}; }
        `;
      }
    }
    return sections;
  } else if (!theme?.includes('color')) {
    let sections = '';

    for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
      sections += `
        .branch-label${i} { fill: ${options.nodeBorder}; ${isReduxTheme ? `font-weight:${options.noteFontWeight}` : ''} }
        .commit${i} { stroke: ${options.nodeBorder};   }
        .commit-highlight${i} { stroke: ${options.nodeBorder}; fill: ${options.nodeBorder}; }
        .label${i}  { fill: ${options.mainBkg}; stroke: ${options.nodeBorder}; stroke-width: ${options.strokeWidth}; ${isReduxTheme ? `font-weight:${options.noteFontWeight}` : ''}}
        .arrow${i} { stroke: ${options.nodeBorder}; }
        .commit-bullets { fill: ${options.nodeBorder}; }
        .commit-cherry-pick${i} { stroke: ${options.nodeBorder}; }
        `;
    }
    return sections;
  } else {
    let sections = '';

    for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
      if (i === 0) {
        sections += `
        .branch-label${i} { fill: ${options.nodeBorder}; ${isReduxTheme ? `font-weight:${options.noteFontWeight}` : ''} }
        .commit${i} { stroke: ${options.nodeBorder}; }
        .commit-highlight${i} { stroke: ${options.nodeBorder}; fill: ${options.mainBkg}; }
        .label${i}  { fill: ${options.mainBkg}; stroke: ${options.nodeBorder}; stroke-width: ${options.strokeWidth}; ${isReduxTheme ? `font-weight:${options.noteFontWeight}` : ''} }
        .arrow${i} { stroke: ${options.nodeBorder}; }
        .commit-bullets { fill: ${options.nodeBorder}; }
        `;
      } else {
        const colorIndex = i % borderColorArray.length;
        sections += `
        .branch-label${i} { fill: ${options.nodeBorder}; ${isReduxTheme ? `font-weight:${options.noteFontWeight}` : ''} }  
        .commit${i} { stroke: ${borderColorArray[colorIndex]}; fill: ${borderColorArray[colorIndex]}; }
        .commit-highlight${i} { stroke: ${borderColorArray[colorIndex]}; fill: ${borderColorArray[colorIndex]}; }
        .label${i}  { fill: ${theme?.includes('dark') ? options.mainBkg : borderColorArray[colorIndex]}; stroke: ${borderColorArray[colorIndex]};  stroke-width: ${options.strokeWidth}; }
        .arrow${i} { stroke: ${borderColorArray[colorIndex]}; }
        `;
      }
    }
    return sections;
  }
};

const normalTheme = (options) => {
  return `${[0, 1, 2, 3, 4, 5, 6, 7]
    .map(
      (i) =>
        `
        .branch-label${i} { fill: ${options['gitBranchLabel' + i]}; }
        .commit${i} { stroke: ${options['git' + i]}; fill: ${options['git' + i]}; }
        .commit-highlight${i} { stroke: ${options['gitInv' + i]}; fill: ${options['gitInv' + i]}; }
        .label${i}  { fill: ${options['git' + i]}; }
        .arrow${i} { stroke: ${options['git' + i]}; }
        `
    )
    .join('\n')}`;
};
const getStyles = (options) => {
  const config = configApi.getConfig();
  const { theme } = config;
  const isReduxTheme = theme?.includes('redux') || theme?.includes('neo');

  return `
  .commit-id,
  .commit-msg,
  .branch-label {
    fill: lightgrey;
    color: lightgrey;
    font-family: 'trebuchet ms', verdana, arial, sans-serif;
    font-family: var(--mermaid-font-family);
  }
  
  ${isReduxTheme ? genColor(options) : normalTheme(options)}

  .branch {
    stroke-width: ${options.strokeWidth};
    stroke: ${options.commitLineColor ?? options.lineColor};
    stroke-dasharray:  ${isReduxTheme ? '4 2' : '2'};
  }
  .commit-label { font-size: ${options.commitLabelFontSize}; fill: ${isReduxTheme ? options.nodeBorder : options.commitLabelColor}; ${isReduxTheme ? `font-weight:${options.noteFontWeight};` : ''}}
  .commit-label-bkg { font-size: ${options.commitLabelFontSize}; fill: ${isReduxTheme ? 'transparent' : options.commitLabelBackground}; opacity: ${isReduxTheme ? '' : 0.5};  }
  .tag-label { font-size: ${options.tagLabelFontSize}; fill: ${options.tagLabelColor};}
  .tag-label-bkg { fill: ${isReduxTheme ? options.mainBkg : options.tagLabelBackground}; stroke: ${isReduxTheme ? options.nodeBorder : options.tagLabelBorder}; ${isReduxTheme ? `filter:${options.dropShadow}` : ''}  }
  .tag-hole { fill: ${options.textColor}; }

  .commit-merge {
    stroke: ${isReduxTheme ? options.mainBkg : options.primaryColor};
    fill: ${isReduxTheme ? options.mainBkg : options.primaryColor};
  }
  .commit-reverse {
    stroke: ${isReduxTheme ? options.mainBkg : options.primaryColor};
    fill: ${isReduxTheme ? options.mainBkg : options.primaryColor};
    stroke-width: ${isReduxTheme ? options.strokeWidth : 3};
  }
  .commit-highlight-outer {
  }
  .commit-highlight-inner {
    stroke: ${isReduxTheme ? options.mainBkg : options.primaryColor};
    fill: ${isReduxTheme ? options.mainBkg : options.primaryColor};
  }

  .arrow {
    stroke-width: ${theme?.includes('redux') ? options.strokeWidth : 8};
    stroke-linecap: round;
    fill: none
  }
  .gitTitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${options.textColor};
  }
`;
};

export default getStyles;
