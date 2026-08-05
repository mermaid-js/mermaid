export interface Position {
  x: number;
  y: number;
}

export interface NodeWithPosition {
  id: string;
  label?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

export interface EdgeWithPoints {
  id: string;
  start?: string;
  end?: string;
  points: Position[];
  [key: string]: unknown;
}

export interface Chain {
  nodes: string[];
  startNode: string;
  endNode: string;
  isCycle?: boolean;
}

export interface AlignmentConstraint {
  nodeId: string;
  direction: 'north' | 'south' | 'east' | 'west';
  alignTo: string;
  axisOnly?: boolean;
}

export interface BendPoint {
  position: Position;
  cost: number;
}
