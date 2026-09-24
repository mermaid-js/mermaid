import type { DiagramStylesProvider } from '../../diagram-api/types.js';

interface BpmnStyleOptions {
  nodeBorder?: string;
  mainBkg?: string;
  lineColor?: string;
  nodeTextColor?: string;
  textColor?: string;
  clusterBkg?: string;
  clusterBorder?: string;
  bpmnLaneBkg?: string;
  bpmnPoolBorder?: string;
  bpmnMessageFlow?: string;
  [key: string]: string | undefined;
}

/**
 * All colours derive from theme `options`; BPMN-specific variables fall back to
 * base theme variables so the diagram themes correctly even before the optional
 * `bpmn*` variables are set in a theme.
 */
const getStyles: DiagramStylesProvider = (options: BpmnStyleOptions = {}) => {
  const border = options.nodeBorder ?? '#333333';
  const fill = options.mainBkg ?? '#ececff';
  const line = options.lineColor ?? '#333333';
  const text = options.nodeTextColor ?? options.textColor ?? '#333333';
  const laneBkg = options.bpmnLaneBkg ?? options.clusterBkg ?? '#ffffff';
  const laneBorder = options.bpmnPoolBorder ?? options.clusterBorder ?? border;
  const messageFlow = options.bpmnMessageFlow ?? line;
  // Events and gateways read best as light BPMN shapes (not the node fill).
  const eventBkg = options.bpmnEventBkg ?? options.background ?? '#ffffff';

  return `
  .bpmn-node .label { color: ${text}; }
  .bpmn-node.bpmn-task rect { fill: ${fill}; stroke: ${border}; }
  .bpmn-node.bpmn-event circle { fill: ${eventBkg}; stroke: ${border}; }
  .bpmn-node.bpmn-event-start circle { stroke-width: 1.5px; }
  .bpmn-node.bpmn-event-end circle { stroke-width: 3.5px !important; }
  .bpmn-node.bpmn-gateway polygon,
  .bpmn-node.bpmn-gateway path { fill: ${eventBkg}; stroke: ${border}; }
  .bpmn-node.bpmn-data path,
  .bpmn-node.bpmn-data rect { fill: ${fill}; stroke: ${border}; }

  .edgePaths path,
  .bpmn-edge { fill: none !important; stroke: ${line}; stroke-width: 1.5px; }
  .bpmn-flow-message { stroke: ${messageFlow}; stroke-dasharray: 6 4; }
  .bpmn-flow-association { stroke: ${line}; stroke-dasharray: 2 4; }

  /* Edge markers (arrowheads) themed; message source is a hollow circle. */
  .marker { fill: ${line}; stroke: ${line}; }
  .marker.circle,
  .marker.circle circle,
  .marker.circle path { fill: ${eventBkg} !important; stroke: ${line}; }

  /* Conditional-flow labels sit cleanly on the edge, on an opaque chip so the
     edge line never strikes through the text. HTML (foreignObject) labels are
     the default under securityLevel 'loose', so the background must be set on
     the .labelBkg div (background-color), not only as an SVG rect fill. */
  .edgeLabel { color: ${text}; }
  .edgeLabel rect, .edgeLabel foreignObject { fill: ${options.edgeLabelBackground ?? '#ffffff'}; }
  .edgeLabel .labelBkg,
  .edgeLabel foreignObject div.labelBkg,
  .edgeLabel .label foreignObject > div {
    background-color: ${options.edgeLabelBackground ?? '#ffffff'};
    opacity: 0.92;
    border-radius: 3px;
  }

  .bpmn-lane rect,
  .cluster.bpmn-lane rect { fill: ${laneBkg}; stroke: ${laneBorder}; }
  .bpmn-lane .cluster-label,
  .bpmn-lane .nodeLabel { color: ${text}; }

  .bpmn-glyph { fill: none; stroke: ${border}; stroke-width: 1.1px; stroke-linecap: round; stroke-linejoin: round; }
  .bpmn-glyph-bold { stroke-width: 2.4px; }
  /* External event/gateway labels carry a halo the colour of the lane fill so a
     crossing edge does not slice through the text (paint-order draws the stroke
     under the fill). */
  .bpmn-ext-label {
    fill: ${text};
    font-size: 11px;
    dominant-baseline: hanging;
    paint-order: stroke;
    stroke: ${laneBkg};
    stroke-width: 3px;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
`;
};

export default getStyles;
