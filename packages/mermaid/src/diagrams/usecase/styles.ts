interface UsecaseStyleOptions {
  actorBkg?: string;
  actorBorder?: string;
  actorTextColor?: string;
  clusterBkg: string;
  clusterBorder: string;
  fontFamily: string;
  lineColor: string;
  mainBkg: string;
  nodeBorder?: string;
  noteBkgColor: string;
  noteBorderColor: string;
  noteTextColor: string;
  primaryColor: string;
  primaryTextColor: string;
  titleColor?: string;
}

const getStyles = (options: UsecaseStyleOptions) => `
  & .usecase-actor {
    color: ${options.actorTextColor ?? options.primaryTextColor};
  }

  & .usecase-actor-shape,
  & .usecase-actor-hollow,
  & .usecase-actor-awesome,
  & .usecase-actor-icon {
    fill: ${options.actorBkg ?? options.mainBkg};
    stroke: ${options.actorBorder ?? options.primaryColor};
    stroke-width: 2px;
  }

  & .usecase-actor .nodeLabel,
  & .actor-label {
    color: ${options.actorTextColor ?? options.primaryTextColor};
    fill: ${options.actorTextColor ?? options.primaryTextColor};
    font-family: var(--mermaid-usecase-actor-font-family, ${options.fontFamily});
    font-size: var(--mermaid-usecase-actor-font-size, 14px);
    font-weight: var(--mermaid-usecase-actor-font-weight, normal);
  }

  & .usecase-element ellipse,
  & .usecase-element rect,
  & .usecase-business ellipse,
  & .usecase-business rect {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder ?? options.primaryColor};
    stroke-width: 2px;
  }

  & .usecase-element .nodeLabel,
  & .usecase-label {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
    font-family: var(--mermaid-usecase-font-family, ${options.fontFamily});
    font-size: var(--mermaid-usecase-font-size, 12px);
    font-weight: var(--mermaid-usecase-font-weight, normal);
  }

  & .usecase-stereotype,
  & .usecase-business-marker {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
    stroke: ${options.nodeBorder ?? options.primaryColor};
  }

  & .system-boundary,
  & .system-boundary-rect,
  & .system-boundary-package {
    fill: ${options.clusterBkg};
    stroke: ${options.clusterBorder};
    stroke-width: 1px;
  }

  & .system-boundary .cluster-label,
  & .system-boundary-title,
  & .system-boundary-package-tab {
    color: ${options.titleColor ?? options.primaryTextColor};
    fill: ${options.titleColor ?? options.primaryTextColor};
  }

  & .usecase-note {
    fill: ${options.noteBkgColor};
    stroke: ${options.noteBorderColor};
    color: ${options.noteTextColor};
  }

  & .usecase-note .nodeLabel {
    color: ${options.noteTextColor};
    fill: ${options.noteTextColor};
  }

  & .usecase-json-table,
  & .usecase-json-table rect,
  & .usecase-json-cell {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder ?? options.primaryColor};
  }

  & .usecase-json-title,
  & .usecase-json-key,
  & .usecase-json-value {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
  }

  & .relationship {
    fill: none;
    stroke: ${options.lineColor};
  }

  & .relationship-include,
  & .relationship-extend,
  & .relationship-note {
    stroke-dasharray: 3;
  }

  & .relationship.edge-animation-fast,
  & .relationship.edge-animation-slow {
    stroke-linecap: round;
  }

  & .relationship-label,
  & .edgeLabel {
    color: ${options.primaryTextColor};
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: 10px;
    font-weight: normal;
  }

  & .marker,
  & .marker.point,
  & .marker.circle,
  & .marker.cross {
    fill: ${options.lineColor};
    stroke: ${options.lineColor};
  }

  & .marker.extension {
    fill: ${options.mainBkg};
    stroke: ${options.lineColor};
  }
`;

export default getStyles;
