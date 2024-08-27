import type { FlowChartStyleOptions } from './diagrams/flowchart/styles.js';
import { log } from './logger.js';
import type { DiagramStylesProvider } from './diagram-api/types.js';

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
    useGradient: boolean;
    dropShadow: string;
    primaryBorderColor: string;
    compositeTitleBackground: string;
  } & FlowChartStyleOptions,
  svgId: string
) => {
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

  /* Classes common for multiple diagrams */

  & .error-icon {
    fill: ${options.errorBkgColor};
  }
  & .error-text {
    fill: ${options.errorTextColor};
    stroke: ${options.errorTextColor};
  }

  & .edge-thickness-normal {
    stroke-width: 1px;
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
    filter: ${options.dropShadow};
  }


  [data-look="neo"].node rect,  [data-look="neo"].node polygon , [data-look="neo"].node path {
    stroke: ${options.useGradient ? 'url(' + svgId + '-gradient)' : 'none'};
    filter: ${options.dropShadow};
  }

  [data-look="neo"].node .neo-line path {
    stroke: ${options.primaryBorderColor};
    filter: none;
  }

  [data-look="neo"].node circle{
    stroke: ${options.useGradient ? 'url(' + svgId + '-gradient)' : options.nodeBorder};
    filter: ${options.dropShadow};
  }

  [data-look="neo"].node circle .state-start{
    fill: #000000;
  }

  [data-look="neo"].statediagram-cluster rect {
    fill: ${options.compositeTitleBackground};
    stroke: ${options.useGradient ? 'url(' + svgId + '-gradient)' : options.nodeBorder};
    stroke-width: 1px;
  }

  ${userStyles}
`;
};

export const addStylesForDiagram = (type: string, diagramTheme?: DiagramStylesProvider): void => {
  if (diagramTheme !== undefined) {
    themes[type] = diagramTheme;
  }
};

export default getStyles;
