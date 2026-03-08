// cspell:ignore cycletime leadtime processtime
import type { BaseDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

export interface VsmDuration {
  min: string;
  max?: string;
}

export interface VsmStep {
  name: string;
  label: string;
  cycletime?: VsmDuration;
  changeover?: VsmDuration;
  uptime?: number;
  batch?: number;
  flowType?: 'push' | 'pull';
}

export interface VsmQueue {
  value: VsmDuration;
}

export interface VsmEndpoint {
  type: 'supplier' | 'customer' | 'from' | 'to';
  label: string;
}

export type VsmFlowItem =
  | { kind: 'endpoint'; data: VsmEndpoint }
  | { kind: 'process'; name: string };

export type VsmSummaryItem = 'leadtime' | 'processtime' | 'waste' | 'efficiency';

export interface VsmSummary {
  all: boolean;
  items: VsmSummaryItem[];
}

export interface VsmData {
  flow: VsmFlowItem[];
  steps: VsmStep[];
  queues: VsmQueue[];
  summary?: VsmSummary;
}

export interface VsmDB extends DiagramDBBase<BaseDiagramConfig> {
  getFlow: () => VsmFlowItem[];
  getSteps: () => VsmStep[];
  getQueues: () => VsmQueue[];
  getSummary: () => VsmSummary | undefined;
  setFlow: (flow: VsmFlowItem[]) => void;
  setSteps: (steps: VsmStep[]) => void;
  setQueues: (queues: VsmQueue[]) => void;
  setSummary: (summary: VsmSummary) => void;
}

export interface VsmStyleOptions {
  stepFill?: string;
  stepStroke?: string;
  stepTextColor?: string;
  queueFill?: string;
  queueStroke?: string;
  endpointFill?: string;
  endpointStroke?: string;
  timelineBg?: string;
  arrowColor?: string;
  fontSize?: number;
}
