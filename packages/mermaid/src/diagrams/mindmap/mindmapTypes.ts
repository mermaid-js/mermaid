import type { RequiredDeep } from 'type-fest';

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
  isRoot?: boolean;
  labelType?: string;
}

export type FilledMindMapNode = RequiredDeep<MindmapNode>;
