import type { ShapeID } from '../../rendering-util/rendering-elements/shapes.js';

/**
 * Valid `type` args to `yy.addVertex` taken from
 * `packages/mermaid/src/diagrams/flowchart/parser/flow.jison`
 */
export type FlowVertexTypeParam =
  | undefined
  | 'square'
  | 'doublecircle'
  | 'circle'
  | 'ellipse'
  | 'stadium'
  | 'subroutine'
  | 'rect'
  | 'cylinder'
  | 'round'
  | 'diamond'
  | 'hexagon'
  | 'odd'
  | 'trapezoid'
  | 'inv_trapezoid'
  | 'lean_right'
  | 'lean_left';

export interface FlowVertex {
  classes: string[];
  dir?: string;
  domId: string;
  haveCallback?: boolean;
  id: string;
  labelType: 'text';
  link?: string;
  linkTarget?: string;
  props?: any;
  styles: string[];
  text?: string;
  type?: ShapeID | FlowVertexTypeParam;
  icon?: string;
  form?: string;
  pos?: 't' | 'b';
  img?: string;
  assetWidth?: number;
  assetHeight?: number;
  defaultWidth?: number;
  imageAspectRatio?: number;
  constraint?: 'on' | 'off';
}

export interface FlowText {
  text: string;
  type: 'text';
}

export interface FlowEdge {
  start: string;
  end: string;
  interpolate?: string;
  type?: string;
  stroke?: 'normal' | 'thick' | 'invisible' | 'dotted';
  style?: string[];
  length?: number;
  text: string;
  labelType: 'text';
  classes: string[];
  id?: string;
  animation?: 'fast' | 'slow';
  animate?: boolean;
}

export interface FlowClass {
  id: string;
  styles: string[];
  textStyles: string[];
}

export interface FlowSubGraph {
  classes: string[];
  dir?: string;
  id: string;
  labelType: string;
  nodes: string[];
  title: string;
}

export interface FlowLink {
  length?: number;
  stroke: string;
  type: string;
  text?: string;
}
