import type { EventModel } from '@mermaid-js/parser';
import type { EventModelDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

export interface EventModelDB extends DiagramDBBase<EventModelDiagramConfig> {
  addBlock: (word: EventModel['blocks'][number]) => boolean;
}

export interface EventModelStyleOptions {
  byteFontSize?: string;
  startByteColor?: string;
  endByteColor?: string;
  labelColor?: string;
  labelFontSize?: string;
  blockStrokeColor?: string;
  blockStrokeWidth?: string;
  blockFillColor?: string;
  titleColor?: string;
  titleFontSize?: string;
}

interface EventModelNodeBase { name: string, displayName?: string }
type EventModelNodeData = {
  type: 'Fact',
  system: string,
} | {
  type: 'Query' | 'Command' | 'AutomatedTrigger'
} | {
  type: 'Trigger',
  pattern: string,
  role: string
}

export interface EventModelData {
  nodes: Record<string, EventModelNodeBase & EventModelNodeData>;
  edges: { from: string; to: string }[];
}
