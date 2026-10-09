import * as configApi from '../../config.js';
const GIT_NAMED_COLOR_COUNT = 8;

const REDUX_GEOMETRY_THEMES = new Set(['redux', 'redux-dark', 'redux-color', 'redux-dark-color']);
const COLOR_THEMES = new Set(['redux-color', 'redux-dark-color']);
const NEO_THEMES = new Set(['neo', 'neo-dark']);
const DARK_THEMES = new Set(['dark', 'redux-dark', 'redux-dark-color', 'neo-dark']);
const NEO_COLOR_GEN_THEMES = new Set([
  'redux',
  'redux-dark',
  'redux-color',
  'redux-dark-color',
  'neo',
  'neo-dark',
]);

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
  const useReduxGeometry = REDUX_GEOMETRY_THEMES.has(theme);
  if (NEO_THEMES.has(theme)) {
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
        // Wrap index to stay within the range of defined git color variables (git0..git7).
        const ci = i % GIT_NAMED_COLOR_COUNT;
        sections += `
        .branch-label${i} { fill: ${options['gitBranchLabel' + ci]}; }
        .commit${i} { stroke: ${options['git' + ci]}; fill: ${options['git' + ci]}; }
        .commit-highlight${i} { stroke: ${options['gitInv' + ci]}; fill: ${options['gitInv' + ci]}; }
        .arrow${i} { stroke: ${options['git' + ci]}; }
        `;
      }
    }
    return sections;
  } else if (!COLOR_THEMES.has(theme)) {
    let sections = '';

    for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
      sections += `
        .branch-label${i} { fill: ${options.nodeBorder}; ${useReduxGeometry ? `font-weight:${options.noteFontWeight}` : ''} }
        .commit${i} { stroke: ${options.nodeBorder};   }
        .commit-highlight${i} { stroke: ${options.nodeBorder}; fill: ${options.nodeBorder}; }
        .label${i}  { fill: ${options.mainBkg}; stroke: ${options.nodeBorder}; stroke-width: ${options.strokeWidth}; ${useReduxGeometry ? `font-weight:${options.noteFontWeight}` : ''}}
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
        .branch-label${i} { fill: ${options.nodeBorder}; ${useReduxGeometry ? `font-weight:${options.noteFontWeight}` : ''} }
        .commit${i} { stroke: ${options.nodeBorder}; }
        .commit-highlight${i} { stroke: ${options.nodeBorder}; fill: ${options.mainBkg}; }
        .label${i}  { fill: ${options.mainBkg}; stroke: ${options.nodeBorder}; stroke-width: ${options.strokeWidth}; ${useReduxGeometry ? `font-weight:${options.noteFontWeight}` : ''} }
        .arrow${i} { stroke: ${options.nodeBorder}; }
        .commit-bullets { fill: ${options.nodeBorder}; }
        `;
      } else {
        const colorIndex = i % borderColorArray.length;
        sections += `
        .branch-label${i} { fill: ${options.nodeBorder}; ${useReduxGeometry ? `font-weight:${options.noteFontWeight}` : ''} }
        .commit${i} { stroke: ${borderColorArray[colorIndex]}; fill: ${borderColorArray[colorIndex]}; }
        .commit-highlight${i} { stroke: ${borderColorArray[colorIndex]}; fill: ${borderColorArray[colorIndex]}; }
        .label${i}  { fill: ${DARK_THEMES.has(theme) ? options.mainBkg : borderColorArray[colorIndex]}; stroke: ${borderColorArray[colorIndex]};  stroke-width: ${options.strokeWidth}; }
        .arrow${i} { stroke: ${borderColorArray[colorIndex]}; }
        `;
      }
    }
    return sections;
  }
};

const normalTheme = (options) => {
  return `${Array.from({ length: options.THEME_COLOR_LIMIT }, (_, i) => i)
    .map((i) => {
      // Wrap index to stay within the range of defined git color variables (git0..git7).
      const ci = i % GIT_NAMED_COLOR_COUNT;
      return `
        .branch-label${i} { fill: ${options['gitBranchLabel' + ci]}; }
        .commit${i} { stroke: ${options['git' + ci]}; fill: ${options['git' + ci]}; }
        .commit-highlight${i} { stroke: ${options['gitInv' + ci]}; fill: ${options['gitInv' + ci]}; }
        .label${i}  { fill: ${options['git' + ci]}; }
        .arrow${i} { stroke: ${options['git' + ci]}; }
        `;
    })
    .join('\n')}`;
};
const getStyles = (options) => {
  const config = configApi.getConfig();
  const { theme } = config;
  const useNeoColorGen = NEO_COLOR_GEN_THEMES.has(theme);

  return `
  .commit-id,
  .commit-msg,
  .branch-label {
    fill: lightgrey;
    color: lightgrey;
    font-family: 'trebuchet ms', verdana, arial, sans-serif;
    font-family: var(--mermaid-font-family);
  }
  
  ${useNeoColorGen ? genColor(options) : normalTheme(options)}

  .branch {
    stroke-width: ${options.strokeWidth};
    stroke: ${options.commitLineColor ?? options.lineColor};
    stroke-dasharray:  ${useNeoColorGen ? '4 2' : '2'};
  }
  .commit-label { font-size: ${options.commitLabelFontSize}; fill: ${useNeoColorGen ? options.nodeBorder : options.commitLabelColor}; ${useNeoColorGen ? `font-weight:${options.noteFontWeight};` : ''}}
  .commit-label-bkg { font-size: ${options.commitLabelFontSize}; fill: ${useNeoColorGen ? 'transparent' : options.commitLabelBackground}; opacity: ${useNeoColorGen ? '' : 0.5};  }
  .tag-label { font-size: ${options.tagLabelFontSize}; fill: ${options.tagLabelColor};}
  .tag-label-bkg { fill: ${useNeoColorGen ? options.mainBkg : options.tagLabelBackground}; stroke: ${useNeoColorGen ? options.nodeBorder : options.tagLabelBorder}; ${useNeoColorGen ? `filter:${options.dropShadow}` : ''}  }
  .tag-hole { fill: ${options.textColor}; }

  .commit-merge {
    stroke: ${useNeoColorGen ? options.mainBkg : options.primaryColor};
    fill: ${useNeoColorGen ? options.mainBkg : options.primaryColor};
  }
  .commit-reverse {
    stroke: ${useNeoColorGen ? options.mainBkg : options.primaryColor};
    fill: ${useNeoColorGen ? options.mainBkg : options.primaryColor};
    stroke-width: ${useNeoColorGen ? options.strokeWidth : 3};
  }
  .commit-highlight-outer {
  }
  .commit-highlight-inner {
    stroke: ${useNeoColorGen ? options.mainBkg : options.primaryColor};
    fill: ${useNeoColorGen ? options.mainBkg : options.primaryColor};
  }

  .arrow {
    /* Intentional: neo themes keep the bold 8px arrow (like classic themes); only redux-geometry themes use the thinner options.strokeWidth. */
    stroke-width: ${REDUX_GEOMETRY_THEMES.has(theme) ? options.strokeWidth : 8};
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
