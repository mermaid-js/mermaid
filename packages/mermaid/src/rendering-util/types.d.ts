import config from '../../dist/defaultConfig';
import type { MermaidConfig } from '../../dist/config.type';
export type MarkdownWordType = 'normal' | 'strong' | 'emphasis';
export interface MarkdownWord {
  content: string;
  type: MarkdownWordType;
}
export type MarkdownLine = MarkdownWord[];
/** Returns `true` if the line fits a constraint (e.g. it's under 𝑛 chars) */
export type CheckFitFunction = (text: MarkdownLine) => boolean;

// Common properties for any node in the system
interface Node {
  id: string;
  label?: string;
  parentId?: string;
  position?: string; // Keep, this is for notes 'left of', 'right of', etc. Move into nodeNode
  cssStyles?: string; // Renamed from `styles` to `cssStyles`
  cssClasses?: string; // Renamed from `classes` to `cssClasses`
  // style?: string; //REMOVE ✅
  // class?: string; //REMOVE ✅
  // labelText?: string; //REMOVE, use `label` instead  ✅
  // props?: Record<string, unknown>; //REMOVE  ✅
  // type: string; // REMOVE, replace with isGroup: boolean, default false  ✅
  // borders?: string; //REMOVE  ✅
  labelStyle?: string;

  // Flowchart specific properties
  labelType?: string; // REMOVE? Always use markdown string, need to check for KaTeX - ⏳ wait with this one

  domId?: string; // When you create the node in the getData function you do not have the domId yet
  // Rendering specific properties for both Flowchart and State Diagram nodes
  dir?: string; // Only relevant for isGroup true, i.e. a sub-graph or composite state.
  haveCallback?: boolean;
  link?: string;
  linkTarget?: string;
  padding?: number; //REMOVE?, use from LayoutData.config - Keep, this could be shape specific
  shape?: string;
  tooltip?: string;
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

  // Added look to handle
  look?: string;
}

// Common properties for any edge in the system
interface Edge {
  id: string;
  label?: string;
  classes?: string;
  style?: string;
  // Properties common to both Flowchart and State Diagram edges
  arrowhead?: string;
  arrowheadStyle?: string;
  arrowTypeEnd?: string;
  arrowTypeStart?: string;
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
  // Rendering specific properties
  curve?: string;
  labelpos?: string;
  labelStyle?: string;
  minlen?: number;
  pattern?: string;
  thickness?: 'normal' | 'thick' | 'invisible';

  look?: string;
}

interface RectOptions {
  rx: number;
  ry: number;
  labelPaddingX: number;
  labelPaddingY: number;
  classes: string;
}

// Extending the Node interface for specific types if needed
interface ClassDiagramNode extends Node {
  memberData: any; // Specific property for class diagram nodes
}

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

export function createDomElement(node: Node): Node {
  // Create a new DOM element. Assuming we're creating a div as an example
  const element = document.createElement('div');

  // Check if node.domId is set, if not generate a unique identifier for it
  if (!node.domId) {
    // This is a simplistic approach to generate a unique ID
    // In a real application, you might want to use a more robust method
    node.domId = `node-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set the ID of the DOM element
  element.id = node.domId;

  // Optional: Apply styles and classes to the element
  if (node.cssStyles) {
    element.style.cssText = node.cssStyles;
  }
  if (node.classes) {
    element.className = node.classes;
  }

  // Optional: Add content or additional attributes to the element
  // This can be based on other properties of the node
  if (node.label) {
    element.textContent = node.label;
  }

  // Append the newly created element to the document body or a specific container
  // This is just an example; in a real application, you might append it somewhere specific
  document.body.appendChild(element);

  // Return the updated node with its domId set
  return node;
}
