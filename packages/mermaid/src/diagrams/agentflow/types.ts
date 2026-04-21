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
  labelType: 'markdown' | 'string' | 'text';
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
  metadata?: Record<string, unknown>;
}

export interface FlowText {
  text: string;
  type: 'text';
}

export interface FlowEdge {
  isUserDefinedId: boolean;
  start: string;
  end: string;
  interpolate?: string;
  type?: string;
  stroke?: 'normal' | 'thick' | 'invisible' | 'dotted';
  style?: string[];
  length?: number;
  text: string;
  labelType: 'markdown' | 'string' | 'text';
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
  type?:
    | 'subgraph'
    | 'task'
    | 'agent'
    | 'flow'
    | 'types'
    | 'templates'
    | 'skill'
    | 'test'
    | 'directive'
    | 'group';
  metadata?: Record<string, unknown>;
}

export interface FlowLink {
  length?: number;
  stroke: string;
  type: string;
  text?: string;
}

export interface AgentFlowTypeField {
  name: string;
  type: string;
}

export interface AgentFlowTemplateField {
  name: string;
  type: string;
  multiplicity?: number;
  description: string;
  kind?: 'field' | 'section';
}

export interface AgentFlowTemplateDeclaration {
  name: string;
  fields: AgentFlowTemplateField[];
  metadata?: Record<string, unknown>;
}

export type AgentFlowTemplateDeclarationsByName = Record<string, AgentFlowTemplateDeclaration>;

export type AgentFlowTypeDeclaration =
  | {
      name: string;
      kind: 'opaque';
      metadata?: Record<string, unknown>;
    }
  | {
      name: string;
      kind: 'alias';
      expression: string;
      metadata?: Record<string, unknown>;
    }
  | {
      name: string;
      kind: 'record';
      fields: AgentFlowTypeField[];
      metadata?: Record<string, unknown>;
    };

export type AgentFlowTypeDeclarationsByName = Record<string, AgentFlowTypeDeclaration>;

// ───────────────────────────────────────────────────────────────────────────
// Element-mapping infrastructure (PR 2a of the wave-1 readiness plan).
//
// Mirrors the shapes used by `alana/flowchart_jison_highlight`'s
// FlowchartElementMapping so that when both diagram types reach a shared
// home (planned lift to `diagram-api/types.ts`), the types are name-identical
// and can be merged without a rename.
// ───────────────────────────────────────────────────────────────────────────

/** Position of an element in the original diagram source. */
export interface ElementPosition {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  startIndex: number;
  endIndex: number;
}

/** The kinds of top-level statements agentflow currently emits mappings for. */
export type AgentflowStatementType = 'vertex' | 'edge' | 'subgraph' | 'type' | 'template';

/** A single element-to-position mapping. */
export interface AgentflowElementMapping {
  id: string;
  type: AgentflowStatementType;
  position: ElementPosition;
}
