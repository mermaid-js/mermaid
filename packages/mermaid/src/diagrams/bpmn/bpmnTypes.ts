import type { DiagramDBBase } from '../../diagram-api/types.js';
import type { BPMNDiagramConfig as BpmnDiagramConfig } from '../../config.type.js';
import type { LayoutData } from '../../rendering-util/types.js';

/** Layout direction. `TD` normalizes to `TB`. */
export type BpmnDirection = 'LR' | 'RL' | 'TB' | 'BT';

export type EventPosition = 'start' | 'intermediate' | 'end';
export type EventTrigger = 'none' | 'message' | 'timer';
export type TaskSubtype = 'abstract' | 'user' | 'service' | 'script';
export type GatewayKind = 'exclusive' | 'parallel' | 'inclusive' | 'event';
export type FlowKind = 'sequence' | 'message' | 'association';

export interface BpmnEvent {
  kind: 'event';
  id: string;
  label?: string;
  position: EventPosition;
  trigger: EventTrigger;
  laneId?: string;
  poolId?: string;
  line: number;
}

export interface BpmnTask {
  kind: 'task';
  id: string;
  label?: string;
  subtype: TaskSubtype;
  laneId?: string;
  poolId?: string;
  line: number;
}

export interface BpmnGateway {
  kind: 'gateway';
  id: string;
  label?: string;
  gateway: GatewayKind;
  laneId?: string;
  poolId?: string;
  line: number;
}

export interface BpmnData {
  kind: 'data';
  id: string;
  label?: string;
  laneId?: string;
  poolId?: string;
  line: number;
}

export type BpmnNode = BpmnEvent | BpmnTask | BpmnGateway | BpmnData;

export interface BpmnFlow {
  id: string;
  sourceId: string;
  targetId: string;
  kind: FlowKind;
  label?: string;
  /** condition text carried by a flow leaving an exclusive/inclusive gateway */
  condition?: string;
  isDefault?: boolean;
  line: number;
}

export interface BpmnLane {
  id: string;
  label: string;
  poolId: string;
  order: number;
}

export interface BpmnPool {
  id: string;
  label: string;
  order: number;
  laneIds: string[];
}

/** The whole parsed-and-validated diagram model. */
export interface BpmnModel {
  direction: BpmnDirection;
  nodes: BpmnNode[];
  flows: BpmnFlow[];
  lanes: BpmnLane[];
  pools: BpmnPool[];
}

export interface BpmnDB extends DiagramDBBase<BpmnDiagramConfig> {
  clear: () => void;
  setDirection: (dir: BpmnDirection) => void;
  getDirection: () => BpmnDirection;
  addNode: (node: BpmnNode) => void;
  addFlow: (flow: BpmnFlow) => void;
  addPool: (pool: BpmnPool) => void;
  addLane: (lane: BpmnLane) => void;
  getModel: () => BpmnModel;
  getData: () => LayoutData;
}
