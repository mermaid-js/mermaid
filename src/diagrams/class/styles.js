const getStyles = options =>
  `g.classGroup text {
  fill: ${options.nodeBorder};
  stroke: none;
  font-family: 'trebuchet ms', verdana, arial;
  font-family: var(--mermaid-font-family);
  font-size: 10px;

  .title {
    font-weight: bolder;
  }
}

g.clickable {
  cursor: pointer;
}

g.classGroup rect {
  fill: ${options.nodeBkg};
  stroke: ${options.nodeBorder};
}

g.classGroup line {
  stroke: ${options.nodeBorder};
  stroke-width: 1;
}

.classLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${options.nodeBkg};
  opacity: 0.5;
}

.classLabel .label {
  fill: ${options.nodeBorder};
  font-size: 10px;
}

.relation {
  stroke: ${options.nodeBorder};
  stroke-width: 1;
  fill: none;
}

.dashed-line{
  stroke-dasharray: 3;
}

#compositionStart, #compositionEnd, #dependencyStart, #dependencyEnd, #extensionStart, #extensionEnd {
  fill: ${options.nodeBorder};
  stroke: ${options.nodeBorder};
  stroke-width: 1;
}

#aggregationStart, #aggregationEnd  {
    fill: ${options.nodeBkg};
  stroke: ${options.nodeBorder};
  stroke-width: 1;
}
`;

export default getStyles;
