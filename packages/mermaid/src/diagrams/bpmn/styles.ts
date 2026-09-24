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

  return `
  .bpmn-node .label { color: ${text}; }
  .bpmn-node.bpmn-task rect { fill: ${fill}; stroke: ${border}; }
  .bpmn-node.bpmn-event circle { fill: ${options.clusterBkg ?? '#ffffff'}; stroke: ${border}; }
  .bpmn-node.bpmn-event-start circle { stroke-width: 1.5px; }
  .bpmn-node.bpmn-event-end circle { stroke-width: 3px; }
  .bpmn-node.bpmn-gateway polygon,
  .bpmn-node.bpmn-gateway path { fill: ${options.clusterBkg ?? '#ffffff'}; stroke: ${border}; }
  .bpmn-node.bpmn-data path,
  .bpmn-node.bpmn-data rect { fill: ${fill}; stroke: ${border}; }

  .bpmn-edge path { stroke: ${line}; }
  .bpmn-flow-message path { stroke: ${messageFlow}; stroke-dasharray: 6 4; }
  .bpmn-flow-association path { stroke: ${line}; stroke-dasharray: 2 3; }

  .bpmn-lane rect,
  .cluster.bpmn-lane rect { fill: ${laneBkg}; stroke: ${laneBorder}; }
  .bpmn-lane .cluster-label,
  .bpmn-lane .nodeLabel { color: ${text}; }

  .bpmn-glyph { fill: none; stroke: ${border}; stroke-width: 1.1px; stroke-linecap: round; stroke-linejoin: round; }
  .bpmn-glyph-bold { stroke-width: 2.4px; }
  .bpmn-ext-label { fill: ${text}; font-size: 12px; dominant-baseline: hanging; }
`;
};

export default getStyles;
