import type { DiagramStylesProvider } from '../../diagram-api/types.js';

const getStyles: DiagramStylesProvider = (options) => `
  .orgchart-title {
    fill: ${options.textColor};
    font-size: 18px;
    text-anchor: middle;
  }
  .orgchart .orgchart-connector,
  .orgchart .orgchart-connector path {
    stroke: ${options.lineColor};
    stroke-width: 2px;
    fill: none;
  }
  .orgchart .orgchart-connector-staff,
  .orgchart .orgchart-connector-staff path {
    stroke-width: 1.5px;
  }
  .orgchart .orgchart-node rect {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder};
    stroke-width: 1px;
  }
  .orgchart .orgchart-node-staff rect {
    fill: ${options.secondaryColor};
  }
  .orgchart .orgchart-node-fill {
    fill: ${options.mainBkg};
    stroke: none;
  }
  .orgchart .orgchart-node-staff .orgchart-node-fill {
    fill: ${options.secondaryColor};
  }
  .orgchart .orgchart-node-outline {
    fill: none;
    stroke: ${options.nodeBorder};
    stroke-width: 1px;
  }
  .orgchart .orgchart-node text {
    fill: ${options.nodeTextColor ?? options.textColor};
    font-family: ${options.fontFamily};
    text-anchor: middle;
    dominant-baseline: middle;
  }
  .orgchart .orgchart-label {
    font-size: ${options.fontSize};
    font-weight: 600;
  }
  .orgchart .orgchart-secondary-label {
    font-size: calc(${options.fontSize} * 0.85);
  }
  .orgchart .orgchart-node-staff .orgchart-secondary-label {
    fill: ${options.nodeTextColor ?? options.textColor};
  }
`;

export default getStyles;
