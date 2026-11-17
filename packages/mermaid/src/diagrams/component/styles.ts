import type { DiagramStylesProvider } from '../../diagram-api/types.js';

interface ComponentStyleOptions {
  clusterBkg: string;
  clusterBorder: string;
  edgeLabelBackground: string;
  fontFamily: string;
  lineColor: string;
  mainBkg: string;
  nodeBorder?: string;
  noteBkgColor: string;
  noteBorderColor: string;
  noteTextColor: string;
  primaryColor: string;
  primaryTextColor: string;
  titleColor?: string;
  componentBkg?: string;
  componentBorder?: string;
  interfaceBkg?: string;
  interfaceBorder?: string;
  portBkg?: string;
  portBorder?: string;
  packageBorder?: string;
  actorBkg?: string;
  actorBorder?: string;
  actorTextColor?: string;
}

const getStyles: DiagramStylesProvider = (options: ComponentStyleOptions) => {
  const componentBkg = options.componentBkg ?? options.mainBkg;
  const componentBorder = options.componentBorder ?? options.nodeBorder ?? options.primaryColor;
  const interfaceBkg = options.interfaceBkg ?? options.mainBkg;
  const interfaceBorder = options.interfaceBorder ?? options.lineColor;
  const portBkg = options.portBkg ?? options.mainBkg;
  const portBorder = options.portBorder ?? componentBorder;
  const packageBorder = options.packageBorder ?? options.clusterBorder;

  return `
  & .component-box rect,
  & .component-group rect.boundary-body,
  & .component-group rect.boundary-tab {
    fill: ${componentBkg};
    stroke: ${componentBorder};
    stroke-width: 2px;
  }

  & .component-box .component-icon rect {
    fill: ${componentBkg};
    stroke: ${componentBorder};
  }

  & .component-box .nodeLabel,
  & .component-group .system-boundary-title span {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
  }

  & .component-stereotype {
    font-style: italic;
  }

  & .component-interface circle {
    fill: ${interfaceBkg};
    stroke: ${interfaceBorder};
    stroke-width: 2px;
  }

  & .component-interface .nodeLabel,
  & .component-port .nodeLabel {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
  }

  & .component-package .system-boundary-title span,
  & .component-package .system-boundary-title .nodeLabel {
    color: ${options.titleColor ?? options.primaryTextColor};
    fill: ${options.titleColor ?? options.primaryTextColor};
    font-family: ${options.fontFamily};
  }

  & .component-port rect {
    fill: ${portBkg};
    stroke: ${portBorder};
    stroke-width: 1.5px;
  }

  & .component-package rect.boundary-body,
  & .component-package rect.boundary-tab,
  & .system-boundary-package-tab {
    fill: ${options.clusterBkg};
    stroke: ${packageBorder};
    stroke-width: 1px;
  }

  & .component-actor .usecase-actor-glyph path,
  & .component-actor .usecase-actor-glyph circle {
    fill: ${options.actorBkg ?? options.mainBkg};
    stroke: ${options.actorBorder ?? componentBorder};
    stroke-width: 2px;
  }

  & .component-actor .nodeLabel,
  & .component-actor .usecase-stereotype {
    color: ${options.actorTextColor ?? options.primaryTextColor};
    fill: ${options.actorTextColor ?? options.primaryTextColor};
    font-family: ${options.fontFamily};
  }

  & .component-note {
    fill: ${options.noteBkgColor};
    stroke: ${options.noteBorderColor};
    color: ${options.noteTextColor};
  }

  & .component-note .nodeLabel {
    color: ${options.noteTextColor};
    fill: ${options.noteTextColor};
  }

  & .component-relation {
    fill: none;
    stroke: ${options.lineColor};
  }

  & .relation-dependency {
    stroke-dasharray: 3;
  }

  & .relation-note {
    stroke-dasharray: 3;
  }

  & .edgeLabel,
  & .edgeLabel p {
    background-color: ${options.edgeLabelBackground};
  }

  & .relationship-label,
  & .edgeLabel {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: 10px;
  }

  & .marker.socket {
    fill: none;
    stroke: ${options.lineColor};
  }

  & .marker.point {
    fill: ${options.lineColor};
    stroke: ${options.lineColor};
  }
`;
};

export default getStyles;
