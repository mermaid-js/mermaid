const getStyles = options =>
  `.label {
    font-family: 'trebuchet ms', verdana, arial;
    font-family: var(--mermaid-font-family);
    color: ${options.textColor};
  }
  .mouth {
    stroke: #666;
  }

  line {
    stroke: ${options.textColor}
  }

  .legend {
    fill: ${options.textColor};
  }

  .label text {
    fill: #333;
  }

  .face {
    fill: #FFF8DC;
    stroke: #999;
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder};
    stroke-width: 1px;
  }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${options.arrowheadColor};
  }

  .edgePath .path {
    stroke: ${options.lineColor};
    stroke-width: 1.5px;
  }

  .flowchart-link {
    stroke: ${options.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${options.edgeLabelBackground};
    rect {
      opacity: 0.5;
    }
    text-align: center;
  }

  .cluster rect {
    fill: ${options.secondBkg};
    stroke: ${options.clusterBorder};
    stroke-width: 1px;
  }

  .cluster text {
    fill: ${options.titleColor};
  }

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: 'trebuchet ms', verdana, arial;
    font-family: var(--mermaid-font-family);
    font-size: 12px;
    background: ${options.secondBkg};
    border: 1px solid ${options.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }
`;

export default getStyles;
