import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramStyleClassDef } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { getDiagramElement } from '../../rendering-util/insertElementsForSize.js';
import { getRegisteredLayoutAlgorithm, render } from '../../rendering-util/render.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import type { Edge, LayoutData, Node } from '../../rendering-util/types.js';
import utils from '../../utils.js';

const WRAP_GROUP_PREFIX = '__mermaid-flow-wrap-group__';

const getEdgeEndpointCounts = (edges: Edge[]) => {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  for (const edge of edges) {
    if (!edge.start || !edge.end) {
      continue;
    }
    outgoing.set(edge.start, (outgoing.get(edge.start) ?? 0) + 1);
    incoming.set(edge.end, (incoming.get(edge.end) ?? 0) + 1);
  }

  return { incoming, outgoing };
};

export const wrapLinearChains = (data4Layout: LayoutData): LayoutData => {
  const flowchartConfig = data4Layout.config.flowchart;
  if (!flowchartConfig?.wrapLinearChains) {
    return data4Layout;
  }

  if (!['LR', 'RL'].includes(data4Layout.direction ?? '')) {
    return data4Layout;
  }

  const wrapThreshold = flowchartConfig.wrapThreshold ?? 6;
  const wrapRowSize = flowchartConfig.wrapRowSize ?? 4;

  if (wrapThreshold < 2 || wrapRowSize < 2) {
    return data4Layout;
  }

  const normalNodes = data4Layout.nodes.filter((node) => !node.isGroup);
  if (normalNodes.length < wrapThreshold || data4Layout.edges.length !== normalNodes.length - 1) {
    return data4Layout;
  }

  if (data4Layout.nodes.some((node) => node.parentId)) {
    return data4Layout;
  }

  const nodeMap = new Map(normalNodes.map((node) => [node.id, node]));
  const { incoming, outgoing } = getEdgeEndpointCounts(data4Layout.edges);
  const startNodes = normalNodes.filter(
    (node) => (incoming.get(node.id) ?? 0) === 0 && (outgoing.get(node.id) ?? 0) === 1
  );

  if (startNodes.length !== 1) {
    return data4Layout;
  }

  const chain: string[] = [];
  const visited = new Set<string>();
  let currentId = startNodes[0].id;

  while (currentId && !visited.has(currentId)) {
    const incomingCount = incoming.get(currentId) ?? 0;
    const outgoingCount = outgoing.get(currentId) ?? 0;

    if (chain.length > 0 && incomingCount !== 1) {
      return data4Layout;
    }
    if (outgoingCount > 1) {
      return data4Layout;
    }

    visited.add(currentId);
    chain.push(currentId);

    const nextEdge = data4Layout.edges.find((edge) => edge.start === currentId);
    if (!nextEdge?.end) {
      break;
    }
    currentId = nextEdge.end;
  }

  if (chain.length !== normalNodes.length || chain.length < wrapThreshold) {
    return data4Layout;
  }

  const rowGroups: Node[] = [];
  const wrappedNodes = [...data4Layout.nodes];
  const baseDirection = data4Layout.direction!;

  for (let index = 0; index < chain.length; index += wrapRowSize) {
    const rowIndex = index / wrapRowSize;
    const rowNodeIds = chain.slice(index, index + wrapRowSize);
    const rowDirection = rowIndex % 2 === 0 ? baseDirection : baseDirection === 'LR' ? 'RL' : 'LR';
    const rowGroupId = `${WRAP_GROUP_PREFIX}${rowIndex}`;

    rowGroups.push({
      id: rowGroupId,
      isGroup: true,
      shape: 'rect',
      dir: rowDirection,
      label: '',
      padding: 0,
      cssClasses: 'flowchart-wrap-group',
      cssCompiledStyles: ['fill:transparent', 'stroke:transparent'],
      labelStyle: '',
      look: data4Layout.config.look,
    });

    for (const nodeId of rowNodeIds) {
      const node = nodeMap.get(nodeId);
      if (!node) {
        return data4Layout;
      }
      wrappedNodes[wrappedNodes.findIndex((candidate) => candidate.id === nodeId)] = {
        ...node,
        parentId: rowGroupId,
      };
    }
  }

  return {
    ...data4Layout,
    direction: 'TB',
    nodes: [...rowGroups, ...wrappedNodes],
  };
};

export const getClasses = function (
  text: string,
  diagramObj: any
): Map<string, DiagramStyleClassDef> {
  return diagramObj.db.getClasses();
};

export const draw = async function (text: string, id: string, _version: string, diag: any) {
  log.info('REF0:');
  log.info('Drawing state diagram (v2)', id);
  const { securityLevel, flowchart: conf, layout } = getConfig();

  // Set the diagram ID for DOM element uniqueness across multiple diagrams
  diag.db.setDiagramId(id);

  // The getData method provided in all supported diagrams is used to extract the data from the parsed structure
  // into the Layout data format
  log.debug('Before getData: ');
  const data4Layout = diag.db.getData() as LayoutData;
  log.debug('Data: ', data4Layout);
  // Create the root SVG
  const svg = getDiagramElement(id, securityLevel);
  const direction = diag.db.getDirection();

  data4Layout.type = diag.type;
  data4Layout.layoutAlgorithm = getRegisteredLayoutAlgorithm(layout);
  if (data4Layout.layoutAlgorithm === 'dagre' && layout === 'elk') {
    log.warn(
      'flowchart-elk was moved to an external package in Mermaid v11. Please refer [release notes](https://github.com/mermaid-js/mermaid/releases/tag/v11.0.0) for more details. This diagram will be rendered using `dagre` layout as a fallback.'
    );
  }
  data4Layout.direction = direction;
  data4Layout.nodeSpacing = conf?.nodeSpacing || 50;
  data4Layout.rankSpacing = conf?.rankSpacing || 50;
  data4Layout.markers = ['point', 'circle', 'cross'];

  data4Layout.diagramId = id;
  log.debug('REF1:', data4Layout);
  await render(wrapLinearChains(data4Layout), svg);
  const padding = data4Layout.config.flowchart?.diagramPadding ?? 8;
  utils.insertTitle(
    svg,
    'flowchartTitleText',
    conf?.titleTopMargin || 0,
    diag.db.getDiagramTitle()
  );
  setupViewPortForSVG(svg, padding, 'flowchart', conf?.useMaxWidth || false);
};

export default {
  getClasses,
  draw,
};
