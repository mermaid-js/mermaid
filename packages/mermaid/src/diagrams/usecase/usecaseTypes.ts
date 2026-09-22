import type { DiagramDB } from '../../diagram-api/types.js';
import type { MermaidConfig, UsecaseDiagramConfig } from '../../config.type.js';
import type { ClusterNode, Edge, LayoutData, NonClusterNode } from '../../rendering-util/types.js';

export type LabelType = 'text' | 'markdown';
export type ActorType = 'normal' | 'hollow' | 'awesome' | 'icon';
export type UseCaseShape = 'ellipse' | 'rect';
export type BoundaryType = 'rect' | 'package';
export type RelationshipType = 'association' | 'include' | 'extend' | 'generalization';
export type Animation = 'fast' | 'slow';

export interface Actor {
  id: string;
  label: string;
  labelType: LabelType;
  type: ActorType;
  icon?: string;
  business: boolean;
  stereotype?: string;
  parentId?: string;
  classes: string[];
  styles: string[];
}

export interface UseCase {
  id: string;
  label: string;
  labelType: LabelType;
  shape: UseCaseShape;
  business: boolean;
  stereotype?: string;
  parentId?: string;
  classes: string[];
  styles: string[];
}

export interface SystemBoundary {
  id: string;
  label: string;
  labelType: LabelType;
  type: BoundaryType;
  members: string[];
  classes: string[];
  styles: string[];
}

export const ARROW_TYPE = {
  SOLID_ARROW: 0,
  BACK_ARROW: 1,
  LINE_SOLID: 2,
  CIRCLE_ARROW: 3,
  CROSS_ARROW: 4,
  CIRCLE_ARROW_REVERSED: 5,
  CROSS_ARROW_REVERSED: 6,
} as const;

export type ArrowType = (typeof ARROW_TYPE)[keyof typeof ARROW_TYPE];

export interface Relationship {
  id: string;
  explicitId: boolean;
  source: string;
  target: string;
  type: RelationshipType;
  arrowType: ArrowType;
  label?: string;
  labelType?: LabelType;
  minlen: number;
  classes: string[];
  styles: string[];
  animate: boolean;
  animation?: Animation;
}

export interface UsecaseNote {
  id: string;
  target: string;
  label: string;
  labelType: LabelType;
}

export interface UsecaseJsonNode {
  id: string;
  value: Record<string, unknown>;
  propertyOrder: Record<string, string[]>;
  classes: string[];
  styles: string[];
}

// Direction types for usecase diagrams
export type Direction = 'TB' | 'TD' | 'BT' | 'RL' | 'LR';

export const DEFAULT_DIRECTION: Direction = 'LR';

export interface ClassDef {
  id: string;
  styles: string[];
}

export interface UsecaseJsonRow {
  /** The visual key cell. Scalar-array rows after the first use an empty string. */
  key: string;
  /** The key repeated for assistive technology even when the visual key is blank. */
  accessibleKey: string;
  value: string;
}

export type UsecaseLayoutNodeShape =
  | 'usecaseActor'
  | 'usecaseActorHollow'
  | 'usecaseActorAwesome'
  | 'usecaseActorIcon'
  | 'usecaseEllipse'
  | 'rect'
  | 'usecaseBusiness'
  | 'note'
  | 'usecaseJsonTable';

export type UsecaseLayoutNode = Omit<NonClusterNode, 'shape'> & {
  shape: UsecaseLayoutNodeShape;
  labelType: LabelType;
  actorType?: ActorType;
  business?: boolean;
  stereotype?: string;
  jsonRows?: UsecaseJsonRow[];
  noteTarget?: string;
  noteTargetLabel?: string;
};

export type UsecaseLayoutCluster = ClusterNode & {
  shape: 'usecaseSystemBoundary';
  labelType: LabelType;
  boundaryType: BoundaryType;
};

export interface UsecaseLayoutEdge extends Edge {
  start: string;
  end: string;
  source: string;
  sourceLabel: string;
  targetLabel: string;
  target: string;
  type: 'edge';
  relationshipType: RelationshipType | 'note';
  pattern: 'solid' | 'dotted';
  arrowTypeStart: string;
  arrowTypeEnd: string;
  internal: boolean;
  style: string[];
  cssCompiledStyles: string[];
  minlen: number;
}

export interface UsecaseLayoutData extends Omit<LayoutData, 'nodes' | 'edges'> {
  nodes: (UsecaseLayoutNode | UsecaseLayoutCluster)[];
  edges: UsecaseLayoutEdge[];
  config: MermaidConfig;
  type: 'usecase';
  layoutAlgorithm: string;
  direction: Direction;
  nodeSpacing: number;
  actorFontSize: number;
  actorFontFamily: string;
  actorFontWeight: string;
  usecaseFontSize: number;
  usecaseFontFamily: string;
  usecaseFontWeight: string;
  rankSpacing: number;
  diagramPadding: number;
  useMaxWidth: boolean;
  markers: ('point' | 'circle' | 'cross' | 'extension')[];
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
  styles?: string[];
  attrs?: Record<string, unknown>;
}

export interface MetadataOccurrence {
  key: string;
  span: Span;
  keySpan: Span;
  valueSpan: Span;
}

export interface NodeOccurrence {
  id: string;
  span: Span;
  idSpan: Span;
  labelSpan?: Span;
  defines?: boolean;
  stereotypeSpan?: Span;
  metadata?: MetadataOccurrence[];
  classSpans?: Span[];
}

export interface EdgeOccurrence {
  id: string;
  span: Span;
  labelSpan?: Span;
  idSpan?: Span;
  metadata?: MetadataOccurrence[];
  classSpans?: Span[];
}

export interface GraphStatement {
  kind:
    | 'node'
    | 'edge'
    | 'group'
    | 'note'
    | 'json'
    | 'metadata'
    | 'edgeMetadata'
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
  metadata?: MetadataOccurrence[];
  stereotypeSpan?: Span;
  classSpans?: Span[];
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
  accTitle?: string;
  accDescr?: string;
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
  groups: Record<string, GraphGroup>;
  classDefs: Record<string, { styles: string[] }>;
  statements: GraphStatement[];
}

export type UsecaseSymbolKind = 'actor' | 'usecase' | 'boundary' | 'json' | 'edge';

export interface UsecaseFields {
  actors: Map<string, Actor>;
  useCases: Map<string, UseCase>;
  systemBoundaries: Map<string, SystemBoundary>;
  relationships: Relationship[];
  notes: Map<string, UsecaseNote>;
  jsonNodes: Map<string, UsecaseJsonNode>;
  classDefs: Map<string, ClassDef>;
  symbols: Map<string, UsecaseSymbolKind>;
  direction: Direction;
  relationshipCounter: number;
  noteCounter: number;
  accTitle: string;
  accDescription: string;
  ast: GraphAST | undefined;
  config: Required<UsecaseDiagramConfig>;
}

export interface UsecaseDB extends DiagramDB {
  getConfig: () => Required<UsecaseDiagramConfig>;
  createModel: () => UsecaseFields;
  commit: (model: UsecaseFields) => void;
  getAST: () => GraphAST | undefined;

  getActors: () => ReadonlyMap<string, Actor>;
  getActor: (id: string) => Actor | undefined;
  getUseCases: () => ReadonlyMap<string, UseCase>;
  getUseCase: (id: string) => UseCase | undefined;
  getSystemBoundaries: () => ReadonlyMap<string, SystemBoundary>;
  getSystemBoundary: (id: string) => SystemBoundary | undefined;
  getRelationships: () => readonly Relationship[];
  getNotes: () => ReadonlyMap<string, UsecaseNote>;
  getNote: (id: string) => UsecaseNote | undefined;
  getJsonNodes: () => ReadonlyMap<string, UsecaseJsonNode>;
  getJsonNode: (id: string) => UsecaseJsonNode | undefined;
  getClassDefs: () => ReadonlyMap<string, ClassDef>;
  getClassDef: (id: string) => ClassDef | undefined;
  getDirection: () => Direction;

  getData: () => UsecaseLayoutData;
  clear: () => void;
}
