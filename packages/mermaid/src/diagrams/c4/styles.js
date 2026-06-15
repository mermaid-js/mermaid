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

  /* C4 outline style (c4model.com): text takes the element's identity color,
     set inline per element, instead of a fixed fill. */
  .c4-shape .label,
  .c4-shape .label text,
  .c4-shape .label span,
  .c4-shape .label p {
    color: inherit;
    fill: currentColor;
  }
  .c4-shape .label small {
    font-size: 0.75em;
  }
  /* Structurizr typography: muted stereotype/type line and smaller description */
  .c4-shape .label .c4-type {
    font-size: 0.75em;
    opacity: 0.85;
  }
  .c4-shape .label .c4-descr {
    font-size: 0.82em;
  }
  /* Outline boxes use a 2px colored border over a light fill. */
  .c4-shape .basic,
  .c4-shape rect,
  .c4-shape path,
  .c4-shape circle,
  .c4-shape ellipse,
  .c4-shape line {
    stroke-width: 2px;
  }

  .arrowheadPath {
    fill: ${options.arrowheadColor};
  }
  .edgePath .path {
    stroke: ${options.lineColor};
    stroke-width: 2px;
  }
  /* C4 relationships are dashed, as on c4model.com */
  path.c4-rel {
    stroke: ${options.lineColor};
    fill: none;
    stroke-dasharray: 6 4;
  }
  .flowchart-link {
    stroke: ${options.lineColor};
    fill: none;
  }
  /* Relationship labels sit on a clean light background, as on c4model.com */
  .edgeLabel {
    background-color: #ffffff;
    p {
      background-color: #ffffff;
    }
    rect {
      opacity: 0.85;
      background-color: #ffffff;
      fill: #ffffff;
    }
    text-align: center;
  }
  .labelBkg {
    background-color: #ffffff;
  }

  /* C4 boundaries are light dashed, mostly-transparent clusters */
  .cluster rect {
    fill: none;
    stroke: ${options.nodeBorder};
    stroke-dasharray: 5 5;
    stroke-width: 1px;
    stroke-opacity: 0.6;
  }
  .cluster .cluster-label {
    font-family: ${options.fontFamily};
    text-anchor: start;
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
