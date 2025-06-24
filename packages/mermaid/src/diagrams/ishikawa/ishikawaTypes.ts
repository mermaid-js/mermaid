import type { RequiredDeep } from 'type-fest';
import type ishikawaDb from './ishikawaDb.js';

export interface IshikawaNode {
  id: number;
  nodeId: string;
  level: number;
  descr: string;
  type: number;
  children: IshikawaNode[];
  width: number;
  padding: number;
  category?: string; // The category this node belongs to (e.g., "People", "Process", etc.)
  section?: number;
  height?: number;
  class?: string;
  icon?: string;
  x?: number;
  y?: number;
}

export type FilledIshikawaNode = RequiredDeep<IshikawaNode>;
export type IshikawaDB = typeof ishikawaDb;
