import classDiagram from './diagrams/class/styles';
import er from './diagrams/er/styles';
import flowchart from './diagrams/flowchart/styles';
import gantt from './diagrams/gantt/styles';
// import gitGraph from './diagrams/git/styles';
import info from './diagrams/info/styles';
import pie from './diagrams/pie/styles';
import requirement from './diagrams/requirement/styles';
import sequence from './diagrams/sequence/styles';
import stateDiagram from './diagrams/state/styles';
import journey from './diagrams/user-journey/styles';
import c4 from './diagrams/c4/styles';
import { FlowChartStyleOptions } from './diagrams/flowchart/styles';
import { log } from './logger';

// TODO @knut: Inject from registerDiagram.
const themes = {
  flowchart,
  'flowchart-v2': flowchart,
  sequence,
  gantt,
  classDiagram,
  'classDiagram-v2': classDiagram,
  class: classDiagram,
  stateDiagram,
  state: stateDiagram,
  // gitGraph,
  info,
  pie,
  er,
  journey,
  requirement,
  c4,
};

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
  let diagramStyles: string = '';
  if (type in themes && themes[type as keyof typeof themes]) {
    diagramStyles = themes[type as keyof typeof themes](options);
  } else {
    log.warn(`No theme found for ${type}`);
  }
  return ` {
    font-family: ${options.fontFamily};
    font-size: ${options.fontSize};
    fill: ${options.textColor}
  }

  /* Classes common for multiple diagrams */

  .error-icon {
    fill: ${options.errorBkgColor};
  }
  .error-text {
    fill: ${options.errorTextColor};
    stroke: ${options.errorTextColor};
  }

  .edge-thickness-normal {
    stroke-width: 2px;
  }
  .edge-thickness-thick {
    stroke-width: 3.5px
  }
  .edge-pattern-solid {
    stroke-dasharray: 0;
  }

  .edge-pattern-dashed{
    stroke-dasharray: 3;
  }
  .edge-pattern-dotted {
    stroke-dasharray: 2;
  }

  .marker {
    fill: ${options.lineColor};
    stroke: ${options.lineColor};
  }
  .marker.cross {
    stroke: ${options.lineColor};
  }

  svg {
    font-family: ${options.fontFamily};
    font-size: ${options.fontSize};
  }

  ${diagramStyles}

  ${userStyles}
`;
};

export const addStylesForDiagram = (type, diagramTheme) => {
  themes[type] = diagramTheme;
};

export default getStyles;
