import type { RequiredDeep } from 'type-fest';
import type kanbanDb from './kanbanDb.js';

export interface KanbanNode {
  id: number;
  nodeId: string;
  level: number;
  descr: string;
  type: number;
  children: KanbanNode[];
  width: number;
  padding: number;
  section?: number;
  height?: number;
  class?: string;
  icon?: string;
  x?: number;
  y?: number;
}

export type FilledKanbanNode = RequiredDeep<KanbanNode>;
export type KanbanDB = typeof kanbanDb;
