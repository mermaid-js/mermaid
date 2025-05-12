import type { DiagramDBBase, DiagramStyleClassDef } from '../../diagram-api/types.js';
import type { BaseDiagramConfig } from '../../config.type.js';

export interface TreemapNode {
  name: string;
  children?: TreemapNode[];
  value?: number;
  parent?: TreemapNode;
  classSelector?: string;
  cssCompiledStyles?: string[];
}

export interface TreemapDB extends DiagramDBBase<TreemapDiagramConfig> {
  getNodes: () => TreemapNode[];
  addNode: (node: TreemapNode, level: number) => void;
  getRoot: () => TreemapNode | undefined;
  getClasses: () => Map<string, DiagramStyleClassDef>;
  addClass: (className: string, style: string) => void;
  getStylesForClass: (classSelector: string) => string[];
}

export interface TreemapStyleOptions {
  sectionStrokeColor?: string;
  sectionStrokeWidth?: string;
  sectionFillColor?: string;
  leafStrokeColor?: string;
  leafStrokeWidth?: string;
  leafFillColor?: string;
  labelColor?: string;
  labelFontSize?: string;
  valueFontSize?: string;
  valueColor?: string;
  titleColor?: string;
  titleFontSize?: string;
}

export interface TreemapData {
  nodes: TreemapNode[];
  levels: Map<TreemapNode, number>;
  root?: TreemapNode;
}

// Define the TreemapDiagramConfig interface
export interface TreemapDiagramConfig extends BaseDiagramConfig {
  padding?: number;
  showValues?: boolean;
  nodeWidth?: number;
  nodeHeight?: number;
  borderWidth?: number;
  valueFontSize?: number;
  labelFontSize?: number;
}
