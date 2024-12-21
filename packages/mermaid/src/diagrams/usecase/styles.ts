export interface UsecaseStyleOptions {
  clusterBkg: string;
  clusterBorder: string;
  lineColor: string;
  mainBkg: string;
}

const getStyles = (options: UsecaseStyleOptions) =>
  `
  .actor {
    stroke: ${options.lineColor};
    background: white;
  }
  .node {
    fill: ${options.mainBkg};
  }
  .cluster rect {
    fill: ${options.clusterBkg};
    stroke: ${options.clusterBorder};
    stroke-width: 1px;
  }
  .flowchart-link {
    stroke: ${options.lineColor};
    fill: none;
  }
`;

export default getStyles;
