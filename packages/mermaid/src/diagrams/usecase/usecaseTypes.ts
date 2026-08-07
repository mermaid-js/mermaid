import type { DiagramDB } from '../../diagram-api/types.js';
import type { UsecaseDiagramConfig } from '../../config.type.js';
import type { LayoutData } from '../../rendering-util/types.js';

export type ActorMetadata = Record<string, string>;

export interface Actor {
  id: string;
  name: string;
  description?: string;
  metadata?: ActorMetadata;
  styles?: string[]; // Direct CSS styles applied to this actor
}

export interface UseCase {
  id: string;
  name: string;
  description?: string;
  nodeId?: string; // Optional node ID (e.g., 'a' in 'a(Go through code)')
  systemBoundary?: string; // Optional reference to system boundary
  classes?: string[]; // CSS classes applied to this use case
  styles?: string[]; // Direct CSS styles applied to this use case
}

export type SystemBoundaryType = 'package' | 'rect';

export interface SystemBoundary {
  id: string;
  name: string;
  useCases: string[]; // Array of use case IDs within this boundary
  type?: SystemBoundaryType; // Type of boundary rendering (default: 'rect')
  styles?: string[]; // Direct CSS styles applied to this system boundary
}

// Arrow types for usecase diagrams (matching parser types)
export const ARROW_TYPE = {
  SOLID_ARROW: 0, // -->
  BACK_ARROW: 1, // <--
  LINE_SOLID: 2, // --
  CIRCLE_ARROW: 3, // --o
  CROSS_ARROW: 4, // --x
  CIRCLE_ARROW_REVERSED: 5, // o--
  CROSS_ARROW_REVERSED: 6, // x--
} as const;

export type ArrowType = (typeof ARROW_TYPE)[keyof typeof ARROW_TYPE];

export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: 'association' | 'include' | 'extend';
  arrowType: ArrowType;
  label?: string;
}

// Direction types for usecase diagrams
export type Direction = 'TB' | 'TD' | 'BT' | 'RL' | 'LR';

export const DEFAULT_DIRECTION: Direction = 'LR';

export interface ClassDef {
  id: string;
  styles: string[];
}

export type Span = [start: number, end: number];

export interface GraphNode {
  label?: string;
  shape?: string;
  classes?: string[];
  styles?: string[];
  attrs?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  classes?: string[];
  styles?: string[];
  attrs?: Record<string, unknown>;
}

export interface GraphGroup {
  title?: string;
  parent?: string;
  nodes: string[];
  direction?: Exclude<Direction, 'TD'>;
  classes?: string[];
  attrs?: Record<string, unknown>;
}

export interface NodeOccurrence {
  id: string;
  span: Span;
  idSpan: Span;
  labelSpan?: Span;
  defines?: boolean;
}

export interface EdgeOccurrence {
  id: string;
  span: Span;
  labelSpan?: Span;
  idSpan?: Span;
}

export interface GraphStatement {
  kind:
    | 'node'
    | 'edge'
    | 'group'
    | 'classDef'
    | 'classAssign'
    | 'style'
    | 'linkStyle'
    | 'click'
    | 'direction'
    | 'accTitle'
    | 'accDescr'
    | 'comment'
    | 'blank'
    | 'frontmatter';
  span: Span;
  nodes?: NodeOccurrence[];
  edges?: EdgeOccurrence[];
  group?: string;
  idSpan?: Span;
  titleSpan?: Span;
  endSpan?: Span;
  ref?: string;
  refSpan?: Span;
  children?: GraphStatement[];
}

export interface GraphAST {
  version: 1;
  diagramType: 'usecase';
  source: string;
  header: {
    keyword: 'usecase';
    direction: Exclude<Direction, 'TD'>;
    span: Span;
  };
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
  groups: Record<string, GraphGroup>;
  classDefs: Record<string, { styles: string[] }>;
  statements: GraphStatement[];
}

export interface UsecaseFields {
  actors: Map<string, Actor>;
  useCases: Map<string, UseCase>;
  systemBoundaries: Map<string, SystemBoundary>;
  relationships: Relationship[];
  classDefs: Map<string, ClassDef>;
  direction: Direction;
  config: Required<UsecaseDiagramConfig>;
}

export interface UsecaseDB extends DiagramDB {
  getConfig: () => Required<UsecaseDiagramConfig>;
  getAST: () => GraphAST | undefined;
  setAST: (ast: GraphAST) => void;

  // Actor management
  addActor: (actor: Actor) => void;
  getActors: () => Map<string, Actor>;
  getActor: (id: string) => Actor | undefined;

  // UseCase management
  addUseCase: (useCase: UseCase) => void;
  getUseCases: () => Map<string, UseCase>;
  getUseCase: (id: string) => UseCase | undefined;

  // SystemBoundary management
  addSystemBoundary: (systemBoundary: SystemBoundary) => void;
  getSystemBoundaries: () => Map<string, SystemBoundary>;
  getSystemBoundary: (id: string) => SystemBoundary | undefined;

  // Relationship management
  addRelationship: (relationship: Relationship) => void;
  getRelationships: () => Relationship[];

  // ClassDef management
  addClassDef: (classDef: ClassDef) => void;
  getClassDefs: () => Map<string, ClassDef>;
  getClassDef: (id: string) => ClassDef | undefined;

  // Direction management
  setDirection: (direction: Direction) => void;
  getDirection: () => Direction;

  // Unified rendering support
  getData: () => LayoutData;

  // Utility methods
  clear: () => void;
}
