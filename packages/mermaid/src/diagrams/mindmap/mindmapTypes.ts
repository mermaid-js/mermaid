import type mindmapDb from './mindmapDb.js';

export interface MindMapNode {
  id: number;
  nodeId: string;
  level: number;
  descr: string;
  type: number;
  children: MindMapNode[];
  width: number;
  padding: number;
  section?: number;
  height?: number;
  class?: string;
  icon?: string;
  x?: number;
  y?: number;
}

export type MindmapDB = typeof mindmapDb;
