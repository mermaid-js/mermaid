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
  .label {
    color: ${options.textColor}
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

  .task-type-0, .section-type-0  {
    ${options.fillType0 ? `fill: ${options.fillType0}` : ''};
  }
  .task-type-1, .section-type-1  {
    ${options.fillType0 ? `fill: ${options.fillType1}` : ''};
  }
  .task-type-2, .section-type-2  {
    ${options.fillType0 ? `fill: ${options.fillType2}` : ''};
  }
  .task-type-3, .section-type-3  {
    ${options.fillType0 ? `fill: ${options.fillType3}` : ''};
  }
  .task-type-4, .section-type-4  {
    ${options.fillType0 ? `fill: ${options.fillType4}` : ''};
  }
  .task-type-5, .section-type-5  {
    ${options.fillType0 ? `fill: ${options.fillType5}` : ''};
  }
  .task-type-6, .section-type-6  {
    ${options.fillType0 ? `fill: ${options.fillType6}` : ''};
  }
  .task-type-7, .section-type-7  {
    ${options.fillType0 ? `fill: ${options.fillType7}` : ''};
  }
`;

export default getStyles;
