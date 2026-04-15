import type { Selection } from 'd3-selection';
import type { TreeViewDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type NodeType = 'file' | 'directory';

export interface Node {
  id: number;
  level: number;
  name: string;
  nodeType: NodeType;
  iconId?: string;
  cssClass?: string;
  description?: string;
  BBox?: BBox;
  children: Node[];
}

export interface TreeViewDB extends DiagramDBBase<TreeViewDiagramConfig> {
  addNode: (
    level: number,
    name: string,
    nodeType: NodeType,
    cssClass?: string,
    iconId?: string,
    description?: string
  ) => void;
  getRoot: () => Node;
  getCount: () => number;
}

export interface TreeViewDiagramStyles {
  labelColor?: string;
  labelFontSize?: string;
  lineColor?: string;
  iconColor?: string;
  descriptionColor?: string;
  highlightBg?: string;
  highlightStroke?: string;
}

export type D3SVGElement<T extends SVGElement> = Selection<T, unknown, Element | null, unknown>;
