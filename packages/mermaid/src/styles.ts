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
  } & FlowChartStyleOptions
) => {
  let diagramStyles = '';
  if (type in themes && themes[type as keyof typeof themes]) {
    diagramStyles = themes[type as keyof typeof themes](options);
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
    stroke-width: 2px;
  }
  & .edge-thickness-thick {
    stroke-width: 3.5px
  }
  & .edge-pattern-solid {
    stroke-dasharray: 0;
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

  ${diagramStyles}
  .node .neo-node {
    stroke: ${options.nodeBorder};
  }

  [data-look="neo"].node rect, [data-look="neo"].node polygon {
    //stroke: none;
    stroke: ${options.useGradient ? 'url(#gradient)' : options.nodeBorder};
    filter: drop-shadow( 1px 2px 2px rgba(185,185,185,1.0) );
    rx: 3;
    ry: 3;
  }

  [data-look="neo"].node rect,  [data-look="neo"].node circle, [data-look="neo"].node polygon {
    //stroke: $(options.nodeBorder);
    stroke: ${options.useGradient ? 'url(#gradient)' : options.nodeBorder};
    filter: drop-shadow( 1px 2px 2px rgba(185,185,185,1.0) );
    rx: 3;
    ry: 3;
  }

  [data-look="neo"].node circle{
    stroke: $(options.nodeBorder);
    stroke: ${options.useGradient ? 'url(#gradient)' : options.nodeBorder};
    filter: drop-shadow( 1px 2px 2px rgba(185,185,185,1.0) );
    fill: #000000;
    rx: 3;
    ry: 3;
  }

  [data-look="neo"].statediagram-cluster rect {
    fill: ${options.compositeTitleBackground};
    stroke: ${options.useGradient ? 'url(#gradient)' : options.nodeBorder};
    //stroke: none;
    stroke-width: 1px;
    rx: 3;
    ry: 3;
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
