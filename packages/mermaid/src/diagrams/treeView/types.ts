import type { TreeViewDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';
import type { Selection } from 'd3-selection';

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Node {
  id: number;
  level: number;
  name: string;
  BBox?: BBox;
  children: Node[];
}

export interface TreeViewDb extends DiagramDBBase<TreeViewDiagramConfig> {
  addNode: (level: number, name: string) => void;
  getRoot: () => Node;
  getCount: () => number;
}

export interface TreeViewDiagramStyles {
  fontSize?: string;
  fontFamily?: string;
  lineColor?: string;
}

export type D3SVGElement<T extends SVGElement> = Selection<T, unknown, Element | null, unknown>;
