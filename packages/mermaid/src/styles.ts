import type { FlowChartStyleOptions } from './diagrams/flowchart/styles.js';
import { log } from './logger.js';
import type { DiagramStylesProvider } from './diagram-api/types.js';
import * as configApi from './config.js';
import type { MermaidConfig } from './config.type.js';

const themes: Record<string, DiagramStylesProvider> = {};

const getStyles = (
  type: string,
  userStyles: string,
  options: {
    fontFamily: string;
    fontSize: string;
    textColor: string;
    errorBkgColor: string;
    errorTextColor: string;
    lineColor: string;
    useGradient?: boolean;
    dropShadow?: string;
    primaryBorderColor?: string;
    compositeTitleBackground?: string;
    THEME_COLOR_LIMIT?: number;
    nodeBorder?: string;
    mainBkg?: string;
    strokeWidth?: number;
  } & FlowChartStyleOptions,
  svgId: string
) => {
  const config = configApi.getConfig();
  const { theme, look } = config;
  let diagramStyles = '';
  if (type in themes && themes[type]) {
    diagramStyles = themes[type](options);
  } else {
    log.warn(`No theme found for ${type}`);
  }
  return ` & {
    font-family: ${options.fontFamily};
    font-size: ${options.fontSize};
    fill: ${options.textColor}
  }
  @keyframes edge-animation-frame {
    from {
      stroke-dashoffset: 0;
    }
  }
  @keyframes dash {
    to {
      stroke-dashoffset: 0;
    }
  }
  & .edge-animation-slow {
    stroke-dasharray: 9,5 !important;
    stroke-dashoffset: 900;
    animation: dash 50s linear infinite;
    stroke-linecap: round;
  }
  & .edge-animation-fast {
    stroke-dasharray: 9,5 !important;
    stroke-dashoffset: 900;
    animation: dash 20s linear infinite;
    stroke-linecap: round;
  }
  /* Classes common for multiple diagrams */

  & .error-icon {
    fill: ${options.errorBkgColor};
  }
  & .error-text {
    fill: ${options.errorTextColor};
    stroke: ${options.errorTextColor};
  }

  & .edge-thickness-normal {
    stroke-width: ${options.strokeWidth ?? 1}px;
  }
  & .edge-thickness-thick {
    stroke-width: 3.5px
  }
  & .edge-pattern-solid {
    stroke-dasharray: 0;
  }
  & .edge-thickness-invisible {
    stroke-width: 0;
    fill: none;
  }
  & .edge-pattern-dashed{
    stroke-dasharray: 3;
  }
  .edge-pattern-dotted {
    stroke-dasharray: 2;
  }

  & .marker {
    fill: ${options.lineColor};
    stroke: ${options.lineColor};
  }
  & .marker.cross {
    stroke: ${options.lineColor};
  }

  & svg {
    font-family: ${options.fontFamily};
    font-size: ${options.fontSize};
  }
   & p {
    margin: 0
   }

  ${diagramStyles}
  .node .neo-node {
    stroke: ${options.nodeBorder};
  }

  [data-look="neo"].node rect, [data-look="neo"].cluster rect, [data-look="neo"].node polygon {
    stroke: ${options.useGradient ? 'url(' + svgId + '-gradient)' : options.nodeBorder};
    filter: ${options.dropShadow ?? 'none'};
  }


  [data-look="neo"].node path {
    stroke: ${options.useGradient ? 'url(' + svgId + '-gradient)' : options.nodeBorder};
    stroke-width: ${options.strokeWidth ?? 1};
  }

  [data-look="neo"].node .outer-path {
    filter: ${options.dropShadow ?? 'none'};
  }

  [data-look="neo"].node .neo-line path {
    stroke: ${options.nodeBorder};
    filter: none;
  }

  [data-look="neo"].node circle{
    stroke: ${options.useGradient ? 'url(' + svgId + '-gradient)' : options.nodeBorder};
    filter: ${options.dropShadow ?? 'none'};
  }

  [data-look="neo"].node circle .state-start{
    fill: #000000;
  }

  [data-look="neo"].icon-shape .icon {
    fill: ${options.useGradient ? 'url(' + svgId + '-gradient)' : options.nodeBorder};
    filter: ${options.dropShadow ?? 'none'};
  }

    [data-look="neo"].icon-shape .icon-neo path {
    stroke: ${options.useGradient ? 'url(' + svgId + '-gradient)' : options.nodeBorder};
    filter: ${options.dropShadow ?? 'none'};
  }

  ${type === 'gitGraph' && theme?.includes('neo') && look === 'neo' ? genGitGraphGradient(config, svgId) : ''}

  ${userStyles}
`;
};

const genGitGraphGradient = (config: MermaidConfig, svgId: string) => {
  const { themeVariables: options } = config;
  let sections = '';
  if (options.useGradient) {
    for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
      sections += `
      .label${i}  { fill: ${options.mainBkg}; stroke: ${'url(' + svgId + '-gradient)'}; stroke-width: ${options.strokeWidth};}
             `;
    }
  }
  return sections;
};

export const addStylesForDiagram = (type: string, diagramTheme?: DiagramStylesProvider): void => {
  if (diagramTheme !== undefined) {
    themes[type] = diagramTheme;
  }
};

export default getStyles;
