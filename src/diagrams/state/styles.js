const getStyles = options =>
  `g.stateGroup text {
  fill: ${options.nodeBorder};
  stroke: none;
  font-size: 10px;
  font-family: 'trebuchet ms', verdana, arial;
  font-family: var(--mermaid-font-family);
}
g.stateGroup text {
  fill: ${options.textColor};
  stroke: none;
  font-size: 10px;

}
g.stateGroup .state-title {
  font-weight: bolder;
  fill: ${options.labelColor};
}

g.stateGroup rect {
  fill: ${options.nodeBkg};
  stroke: ${options.nodeBorder};
}

g.stateGroup line {
  stroke: ${options.lineColor};
  stroke-width: 1;
}

.transition {
  stroke: ${options.lineColor};
  stroke-width: 1;
  fill: none;
}

.stateGroup .composit {
  fill: ${options.background};
  border-bottom: 1px
}

.stateGroup .alt-composit {
  fill: #e0e0e0;
  border-bottom: 1px
}

.state-note {
  stroke: ${options.noteBorderColor};
  fill: ${options.noteBkgColor};

  text {
    fill: black;
    stroke: none;
    font-size: 10px;
  }
}

.stateLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${options.nodeBkg};
  opacity: 0.5;
}

.edgeLabel .label rect {
  fill: ${options.tertiaryColor};
  opacity: 0.2;
}
.edgeLabel .label text {
  fill: ${options.tertiaryTextColor};
}

.stateLabel text {
  fill: ${options.labelColor};
  font-size: 10px;
  font-weight: bold;
  font-family: 'trebuchet ms', verdana, arial;
  font-family: var(--mermaid-font-family);
}

.node circle.state-start {
  fill: ${options.primaryBorderColor};
  stroke: black;
}
.node circle.state-end {
  fill: ${options.primaryBorderColor};
  stroke: ${options.background};
  stroke-width: 1.5
}

.node rect {
  fill: ${options.mainBkg};
  stroke: ${options.nodeBorder};
  stroke-width: 1px;
}
#statediagram-barbEnd {
  fill: ${options.lineColor};
}

.statediagram-cluster rect {
  fill: ${options.nodeBkg};
  stroke: ${options.nodeBorder};
  stroke-width: 1px;
}

.cluster-label, .nodeLabel {
  color: ${options.textColor};
}

.statediagram-cluster rect.outer {
  rx: 5px;
  ry: 5px;
}
.statediagram-state .divider {
  stroke: ${options.nodeBorder};
}

.statediagram-state .title-state {
  rx: 5px;
  ry: 5px;
}
.statediagram-cluster.statediagram-cluster .inner {
  fill: ${options.background};
}
.statediagram-cluster.statediagram-cluster-alt .inner {
  fill: #e0e0e0;
}

.statediagram-cluster .inner {
  rx:0;
  ry:0;
}

.statediagram-state rect.basic {
  rx: 5px;
  ry: 5px;
}
.statediagram-state rect.divider {
  stroke-dasharray: 10,10;
  fill: ${options.altBackground ? options.altBackground : '#efefef'};
}

.note-edge {
  stroke-dasharray: 5;
}

.statediagram-note rect {
  fill: ${options.noteBkgColor};
  stroke: ${options.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}
.statediagram-note rect {
  fill: ${options.noteBkgColor};
  stroke: ${options.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}

.statediagram-note text {
  fill: ${options.noteTextColor};
}

.statediagram-note .nodeLabel {
  color: ${options.noteTextColor};
}

#dependencyStart, #dependencyEnd {
  fill: ${options.lineColor};
  stroke: ${options.lineColor};
  stroke-width: 1;
}
`;

export default getStyles;
