const getStyles = (options) =>
  `.person {
    stroke: ${options.personBorder};
    fill: ${options.personBkg};
  }

  /* Unified renderer (c4.useUnifiedRenderer) only - the legacy svgDraw
     renderer emits none of the .node/.cluster/.label/.edgeLabel classes. */
  .label {
    font-family: ${options.fontFamily};
    color: ${options.nodeTextColor || options.textColor};
  }
  .label text, span {
    fill: ${options.nodeTextColor || options.textColor};
    color: ${options.nodeTextColor || options.textColor};
  }
  .node rect,
  .node circle,
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

  /* C4 elements show light text on saturated backgrounds */
  .c4-shape .label,
  .c4-shape .label text,
  .c4-shape .label span {
    color: #ffffff;
    fill: #ffffff;
  }
  .c4-shape .label small {
    font-size: 0.75em;
  }

  .arrowheadPath {
    fill: ${options.arrowheadColor};
  }
  .edgePath .path {
    stroke: ${options.lineColor};
    stroke-width: 2px;
  }
  path.c4-rel,
  .flowchart-link {
    stroke: ${options.lineColor};
    fill: none;
  }
  .edgeLabel {
    background-color: ${options.edgeLabelBackground};
    p {
      background-color: ${options.edgeLabelBackground};
    }
    rect {
      opacity: 0.5;
      background-color: ${options.edgeLabelBackground};
      fill: ${options.edgeLabelBackground};
    }
    text-align: center;
  }
  .labelBkg {
    background-color: ${options.edgeLabelBackground};
  }

  /* C4 boundaries are dashed, mostly-transparent clusters */
  .cluster rect {
    fill: none;
    stroke: ${options.nodeBorder};
    stroke-dasharray: 7 7;
    stroke-width: 1px;
  }
  .cluster .cluster-label {
    font-family: ${options.fontFamily};
  }
  .cluster text {
    fill: ${options.titleColor};
  }
  .cluster span {
    color: ${options.titleColor};
  }

  .c4TitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${options.textColor};
    font-family: ${options.fontFamily};
  }
`;

export default getStyles;
