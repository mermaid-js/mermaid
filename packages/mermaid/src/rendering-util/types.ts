export type MarkdownWordType = 'normal' | 'strong' | 'em';
import type { MermaidConfig } from '../config.type.js';
import type { ClusterShapeID } from './rendering-elements/clusters.js';
import type { ShapeID } from './rendering-elements/shapes.js';
export interface MarkdownWord {
  content: string;
  type: MarkdownWordType;
}
export type MarkdownLine = MarkdownWord[];
/** Returns `true` if the line fits a constraint (e.g. it's under 𝑛 chars) */
export type CheckFitFunction = (text: MarkdownLine) => boolean;

interface BaseNode {
  id: string;
  label?: string;
  description?: string[];
  parentId?: string;
  position?: string; // Keep, this is for notes 'left of', 'right of', etc. Move into nodeNode
  cssStyles?: string[]; // Renamed from `styles` to `cssStyles`
  cssCompiledStyles?: string[];
  cssClasses?: string; // Renamed from `classes` to `cssClasses`
  // style?: string; //REMOVE ✅
  // class?: string; //REMOVE ✅
  // labelText?: string; //REMOVE, use `label` instead  ✅
  // props?: Record<string, unknown>; //REMOVE  ✅
  // type: string; // REMOVE, replace with isGroup: boolean, default false  ✅
  // borders?: string; //REMOVE  ✅
  labelStyle?: string; // REMOVE - use cssStyles instead  ✅

  // Flowchart specific properties
  labelType?: string; // REMOVE? Always use markdown string, need to check for KaTeX - ⏳ wait with this one

  domId?: string; // When you create the node in the getData function you do not have the domId yet
  // Rendering specific properties for both Flowchart and State Diagram nodes
  dir?: string; // Only relevant for isGroup true, i.e. a sub-graph or composite state.
  haveCallback?: boolean;
  link?: string;
  linkTarget?: string;
  tooltip?: string;
  padding?: number; //REMOVE?, use from LayoutData.config - Keep, this could be shape specific
  isGroup: boolean;
  width?: number;
  height?: number;
  // Specific properties for State Diagram nodes TODO remove and use generic properties
  intersect?: (point: any) => any;

  // Non-generic properties
  rx?: number; // Used for rounded corners in Rect, Ellipse, etc.Maybe it to specialized RectNode, EllipseNode, etc.
  ry?: number;

  useHtmlLabels?: boolean;
  centerLabel?: boolean; //keep for now.
  //Candidate for removal, maybe rely on labelStyle or a specific property labelPosition: Top, Center, Bottom

  //Node style properties
  backgroundColor?: string;
  borderColor?: string;
  borderStyle?: string;
  borderWidth?: number;
  labelTextColor?: string;

  // Flowchart specific properties
  x?: number;
  y?: number;

  look?: string;
  icon?: string;
  pos?: 't' | 'b';
  img?: string;
  assetWidth?: number;
  assetHeight?: number;
  defaultWidth?: number;
  imageAspectRatio?: number;
  constraint?: 'on' | 'off';
}

/**
 * Group/cluster nodes, e.g. nodes that contain other nodes.
 */
export interface ClusterNode extends BaseNode {
  shape?: ClusterShapeID;
  isGroup: true;
}

export interface NonClusterNode extends BaseNode {
  shape?: ShapeID;
  isGroup: false;
}

// Common properties for any node in the system
export type Node = ClusterNode | NonClusterNode;

// Common properties for any edge in the system
export interface Edge {
  id: string;
  label?: string;
  classes?: string;
  style?: string[];
  animate?: boolean;
  animation?: 'fast' | 'slow';
  // Properties common to both Flowchart and State Diagram edges
  arrowhead?: string;
  arrowheadStyle?: string;
  arrowTypeEnd?: string;
  arrowTypeStart?: string;
  cssCompiledStyles?: string[];
  // Flowchart specific properties
  defaultInterpolate?: string;
  end?: string;
  interpolate?: string;
  labelType?: string;
  length?: number;
  start?: string;
  stroke?: string;
  text?: string;
  type: string;
  // Class Diagram specific properties
  startLabelRight?: string;
  endLabelLeft?: string;
  // Rendering specific properties
  curve?: string;
  labelpos?: string;
  labelStyle?: string[];
  minlen?: number;
  pattern?: string;
  thickness?: 'normal' | 'thick' | 'invisible' | 'dotted';
  look?: string;
}

export interface RectOptions {
  rx: number;
  ry: number;
  labelPaddingX: number;
  labelPaddingY: number;
  classes: string;
}

// Extending the Node interface for specific types if needed
export type ClassDiagramNode = Node & {
  memberData: any; // Specific property for class diagram nodes
};

// Specific interfaces for layout and render data
export interface LayoutData {
  nodes: Node[];
  edges: Edge[];
  config: MermaidConfig;
  [key: string]: any; // Additional properties not yet defined
}

export interface RenderData {
  items: (Node | Edge)[];
  [key: string]: any; // Additional properties not yet defined
}

// This refactored approach ensures that common properties are included in the base `Node` and `Edge` interfaces, with specific types extending these bases with additional properties as needed. This maintains flexibility while ensuring type safety and reducing redundancy.

export type LayoutMethod =
  | 'dagre'
  | 'dagre-wrapper'
  | 'elk'
  | 'neato'
  | 'dot'
  | 'circo'
  | 'fdp'
  | 'osage'
  | 'grid';

export interface ShapeRenderOptions {
  config: MermaidConfig;
  /** Some shapes render differently if a diagram has a direction `LR` */
  dir?: Node['dir'];
}

export type KanbanNode = Node & {
  // Kanban specif data
  priority?: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  ticket?: string;
  assigned?: string;
  icon?: string;
  level: number;
};
