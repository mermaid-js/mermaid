import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../common/commonDb.js';
import { getConfig as getGlobalConfig } from '../../diagram-api/diagramAPI.js';
import { sanitizeText } from '../common/common.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { BPMNDiagramConfig as BpmnDiagramConfig } from '../../config.type.js';
import type { Edge, LayoutData, Node } from '../../rendering-util/types.js';
import type {
  BpmnDB,
  BpmnDirection,
  BpmnFlow,
  BpmnLane,
  BpmnModel,
  BpmnNode,
  BpmnPool,
  EventPosition,
  EventTrigger,
} from './bpmnTypes.js';

export const DEFAULT_BPMN_CONFIG: Required<BpmnDiagramConfig> = DEFAULT_CONFIG.bpmn;

interface State {
  direction: BpmnDirection;
  nodes: BpmnNode[];
  flows: BpmnFlow[];
  lanes: BpmnLane[];
  pools: BpmnPool[];
}

const createState = (): State => ({
  direction: 'LR',
  nodes: [],
  flows: [],
  lanes: [],
  pools: [],
});

let state: State = createState();

const clear = (): void => {
  state = createState();
  commonClear();
};

const setDirection = (dir: BpmnDirection): void => {
  state.direction = dir;
};
const getDirection = (): BpmnDirection => state.direction;

const addNode = (node: BpmnNode): void => {
  state.nodes.push(node);
};
const addFlow = (flow: BpmnFlow): void => {
  state.flows.push(flow);
};
const addPool = (pool: BpmnPool): void => {
  state.pools.push(pool);
};
const addLane = (lane: BpmnLane): void => {
  state.lanes.push(lane);
  const pool = state.pools.find((candidate) => candidate.id === lane.poolId);
  pool?.laneIds.push(lane.id);
};

const getModel = (): BpmnModel => ({
  direction: state.direction,
  nodes: state.nodes,
  flows: state.flows,
  lanes: state.lanes,
  pools: state.pools,
});

const getConfig = (): Required<BpmnDiagramConfig> => {
  const globalConfig = getGlobalConfig();
  return { ...DEFAULT_BPMN_CONFIG, ...globalConfig.bpmn };
};

// --- rendering helpers -------------------------------------------------------

const EVENT_SHAPE: Record<EventPosition, string> = {
  start: 'circle',
  intermediate: 'dbl-circ',
  // single circle; the thick BPMN end border comes from styles.ts
  end: 'circle',
};

const eventClasses = (position: EventPosition, trigger: EventTrigger): string =>
  ['bpmn-node', 'bpmn-event', `bpmn-event-${position}`, `bpmn-trigger-${trigger}`].join(' ');

const nodeShape = (node: BpmnNode): string => {
  switch (node.kind) {
    case 'event':
      return EVENT_SHAPE[node.position];
    case 'task':
      return 'rounded';
    case 'gateway':
      return 'diam';
    case 'data':
      return 'doc';
  }
};

const nodeClasses = (node: BpmnNode): string => {
  switch (node.kind) {
    case 'event':
      return eventClasses(node.position, node.trigger);
    case 'task':
      return `bpmn-node bpmn-task bpmn-task-${node.subtype}`;
    case 'gateway':
      return `bpmn-node bpmn-gateway bpmn-gateway-${node.gateway}`;
    case 'data':
      return 'bpmn-node bpmn-data';
  }
};

/**
 * Builds the generic LayoutData. For the MVP each lane (or, for a pool without
 * lanes, the pool itself) becomes a top-level swimlane band, which is what the
 * `swimlane` layout engine renders natively. Diagrams with no pools/lanes lay out
 * with `dagre`.
 */
const getData = (): LayoutData => {
  const globalConfig = getGlobalConfig();
  const config = getConfig();
  const sanitize = (value: string): string => sanitizeText(value, globalConfig);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Decide the band (top-level group) each element belongs to.
  const laneById = new Map(state.lanes.map((lane) => [lane.id, lane]));
  const poolById = new Map(state.pools.map((pool) => [pool.id, pool]));
  const emittedBands = new Map<string, { id: string; label: string; colorIndex: number }>();

  const bandForNode = (node: BpmnNode): string | undefined => {
    if (node.laneId && laneById.has(node.laneId)) {
      const lane = laneById.get(node.laneId)!;
      if (!emittedBands.has(lane.id)) {
        emittedBands.set(lane.id, {
          id: lane.id,
          label: lane.label,
          colorIndex: emittedBands.size,
        });
      }
      return lane.id;
    }
    if (node.poolId && poolById.has(node.poolId)) {
      const pool = poolById.get(node.poolId)!;
      if (!emittedBands.has(pool.id)) {
        emittedBands.set(pool.id, {
          id: pool.id,
          label: pool.label,
          colorIndex: emittedBands.size,
        });
      }
      return pool.id;
    }
    return undefined;
  };

  const nodeParent = new Map<string, string | undefined>();
  for (const node of state.nodes) {
    nodeParent.set(node.id, bandForNode(node));
  }

  // Band (group) nodes first, in declaration order, so colour slots are stable.
  // Rendered as titled clusters under dagre (see note on layoutAlgorithm below).
  for (const band of emittedBands.values()) {
    nodes.push({
      id: band.id,
      label: sanitize(band.label),
      isGroup: true,
      shape: 'roundedWithTitle',
      padding: 20,
      look: globalConfig.look,
      colorIndex: band.colorIndex,
      cssClasses: 'bpmn-lane',
    } as Node);
  }

  for (const node of state.nodes) {
    const parentId = nodeParent.get(node.id);
    // Events and gateways are drawn as small fixed glyphs with the label rendered
    // *outside* the shape (BPMN convention). Emitting an empty internal label keeps
    // the circle/diamond small; the real label + marker are added in the renderer's
    // decoration pass (bpmnGlyphs).
    const externalLabel = node.kind === 'event' || node.kind === 'gateway';
    nodes.push({
      id: node.id,
      label: externalLabel ? '' : sanitize(node.label ?? node.id),
      shape: nodeShape(node),
      isGroup: false,
      padding: externalLabel ? 7 : 8,
      look: globalConfig.look,
      cssClasses: nodeClasses(node),
      ...(parentId ? { parentId } : {}),
    } as Node);
  }

  let flowCounter = 0;
  for (const flow of state.flows) {
    flowCounter += 1;
    const isMessage = flow.kind === 'message';
    const isAssociation = flow.kind === 'association';
    edges.push({
      id: flow.id || `bpmn-edge-${flowCounter}`,
      start: flow.sourceId,
      end: flow.targetId,
      source: flow.sourceId,
      target: flow.targetId,
      type: 'edge',
      classes: ['bpmn-edge', `bpmn-flow-${flow.kind}`, flow.isDefault ? 'bpmn-flow-default' : '']
        .filter(Boolean)
        .join(' '),
      pattern: isMessage ? 'dashed' : isAssociation ? 'dotted' : 'solid',
      arrowTypeStart: isMessage ? 'circle' : 'none',
      arrowTypeEnd: isAssociation ? 'none' : 'normal',
      ...(flow.label ? { label: sanitize(flow.label) } : {}),
      labelpos: 'c',
      thickness: 'normal',
      look: globalConfig.look,
      minlen: 1,
      style: [],
    } as unknown as Edge);
  }

  // The purpose-built `swimlane` engine draws nicer lane bands, but its current
  // flat (single-level) lane model crashes when routing cross-band edges such as
  // BPMN message flows (unrouted edge -> intersect on an undefined point). Until
  // it is extended to two-level pool>lane nesting (see BPMN_DESIGN.md open Q5),
  // the MVP lays pools/lanes out with dagre as titled clusters, which routes every
  // edge and renders containment correctly.
  return {
    nodes,
    edges,
    config: globalConfig,
    type: 'bpmn',
    layoutAlgorithm: 'dagre',
    direction: state.direction,
    nodeSpacing: config.nodeSpacing,
    rankSpacing: config.rankSpacing,
    diagramPadding: config.diagramPadding,
    useMaxWidth: config.useMaxWidth,
    markers: ['point', 'circle', 'cross'],
  } as unknown as LayoutData;
};

export const db: BpmnDB = {
  clear,
  setDirection,
  getDirection,
  addNode,
  addFlow,
  addPool,
  addLane,
  getModel,
  getData,
  getConfig,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
