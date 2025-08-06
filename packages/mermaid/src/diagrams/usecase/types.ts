import type { DiagramDBBase, DiagramStyleClassDef } from '../../diagram-api/types.js';
import type { BaseDiagramConfig } from '../../config.type.js';

export interface UsecaseNode {
  name: string;
  children?: UsecaseNode[];
  value?: number;
  parent?: UsecaseNode;
  classSelector?: string;
  cssCompiledStyles?: string[];
}

export interface UsecaseDiagramDB extends DiagramDBBase<UsecaseDiagramConfig> {
  getNodes: () => UsecaseNode[];
  addNode: (node: UsecaseNode, level: number) => void;
  getRoot: () => UsecaseNode | undefined;
  getClasses: () => Map<string, DiagramStyleClassDef>;
  addClass: (className: string, style: string) => void;
  getStylesForClass: (classSelector: string) => string[];
  // Update
}

export interface UsecaseStyleOptions {
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

export interface UsecaseData {
  nodes: UsecaseNode[];
  levels: Map<UsecaseNode, number>;
  root?: UsecaseNode;
  outerNodes: UsecaseNode[];
}

export interface UsecaseItem {
  $type: string;
  name: string;
  value?: number;
  classSelector?: string;
}

export interface UsecaseAst {
  title?: string;
  description?: string;
}

// Define the UsecaseDiagramConfig interface
export interface UsecaseDiagramConfig extends BaseDiagramConfig {
  padding?: number;
  diagramPadding?: number;
  showValues?: boolean;
  nodeWidth?: number;
  nodeHeight?: number;
  borderWidth?: number;
  valueFontSize?: number;
  labelFontSize?: number;
  valueFormat?: string;
}
