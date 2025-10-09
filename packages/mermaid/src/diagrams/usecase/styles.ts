const getStyles = (options: any) =>
  `
  .actor {
    stroke: ${options.primaryColor};
    fill: ${options.primaryColor};
  }
  
  .actor-label {
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: 14px;
    font-weight: normal;
  }
  
  .usecase {
    stroke: ${options.primaryColor};
    fill: ${options.primaryColor};
  }
  
  .usecase-label {
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: 12px;
    font-weight: normal;
  }

  /* Ellipse shape styling for use cases */
  .usecase-element ellipse {
    fill: ${options.mainBkg ?? '#ffffff'};
    stroke: ${options.primaryColor};
    stroke-width: 2px;
  }

  .usecase-element .label {
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: 12px;
    font-weight: normal;
    text-anchor: middle;
    dominant-baseline: central;
  }

  /* General ellipse styling */
  .node ellipse {
    fill: ${options.mainBkg ?? '#ffffff'};
    stroke: ${options.nodeBorder ?? options.primaryColor};
    stroke-width: 1px;
  }
  
  .relationship {
    stroke: ${options.lineColor};
    fill: none;
  }
  
  & .marker {
    fill: ${options.lineColor};
    stroke: ${options.lineColor};
  }
  
  .relationship-label {
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: 10px;
    font-weight: normal;
  }
  
  .nodeLabel, .edgeLabel {
  color: ${options.classText};
  }
  .system-boundary {
    fill: ${options.clusterBkg};
    stroke: ${options.clusterBorder};
    stroke-width: 1px;
  }
`;

export default getStyles;
