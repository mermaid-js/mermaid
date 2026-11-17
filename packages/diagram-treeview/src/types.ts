import type { TreeViewDiagramConfig } from '@mermaid-js/core/config.type.js';
import type { DiagramDBBase } from '@mermaid-js/core/diagram-api/types.js';

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
  /** Iconify icon reference (`pack:name`), a built-in icon (`file`/`folder`), or `none` */
  icon?: string;
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
    icon?: string,
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
