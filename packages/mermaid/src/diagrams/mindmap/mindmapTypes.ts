import type { RequiredDeep } from 'type-fest';
import type mindmapDb from './mindmapDb.js';

export interface MindmapNode {
  id: number;
  nodeId: string;
  level: number;
  descr: string;
  type: number;
  children: MindmapNode[];
  width: number;
  padding: number;
  section?: number;
  height?: number;
  class?: string;
  icon?: string;
  x?: number;
  y?: number;
}

export type FilledMindMapNode = RequiredDeep<MindmapNode>;
export type MindmapDB = typeof mindmapDb;
