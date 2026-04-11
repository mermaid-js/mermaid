import type { DiagramDB } from '../../diagram-api/types.js';

export type RailroadNodeKind = 'terminal' | 'nonterminal';

export interface RailroadNode {
  kind: RailroadNodeKind;
  text: string;
}

export interface RailroadNodeLayout extends RailroadNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RailroadConnector {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RailroadRenderModel {
  width: number;
  height: number;
  nodes: RailroadNodeLayout[];
  connectors: RailroadConnector[];
  start: { x: number; y: number; r: number };
  end: { x: number; y: number; r: number };
}

export interface RailroadDB extends DiagramDB {
  setSource: (source: string) => void;
  getSource: () => string;
}
