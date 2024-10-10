import type { RequiredDeep } from 'type-fest';
import type kanbanDb from './kanbanDb.js';

export interface KanbanInternalNode {
  id: number;
  nodeId: string;
  level: number;
  descr: string;
  type: number;
  children: KanbanInternalNode[];
  width: number;
  padding: number;
  section?: number;
  height?: number;
  class?: string;
  icon?: string;
  ticket?: string;
  priority?: string;
  x?: number;
  y?: number;
}

export type FilledKanbanNode = RequiredDeep<KanbanInternalNode>;
export type KanbanDB = typeof kanbanDb;
