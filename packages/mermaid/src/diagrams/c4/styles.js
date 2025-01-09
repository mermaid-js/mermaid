const getStyles = (options) =>
  `.person {
    stroke: ${options.personBorder};
    fill: ${options.personBkg};
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

  .cluster rect {
    stroke: ${options.nodeBorder};
    stroke-width: 1px;
    stroke-dasharray: 7,7;
    fill: transparent;
  }

  .edge {
  stroke: ${options.lineColor};
  stroke-width: 1;
  fill: none;
}

.nodeLabel, .edgeLabel {
  color: ${options.classText};
}
.edgeLabel .label rect {
  fill: ${options.mainBkg};
}
.label text {
  fill: ${options.classText};
}

.labelBkg {
  background: ${options.mainBkg};
}
.edgeLabel .label span {
  background: ${options.mainBkg};
}
`;

export default getStyles;
