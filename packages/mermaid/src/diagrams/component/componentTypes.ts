import type { DiagramDB } from '../../diagram-api/types.js';
import type { ComponentDiagramConfig, MermaidConfig } from '../../config.type.js';
import type { ClusterNode, Edge, LayoutData, NonClusterNode } from '../../rendering-util/types.js';

export type Direction = 'TB' | 'TD' | 'BT' | 'RL' | 'LR';
export const DEFAULT_DIRECTION: Direction = 'LR';

export type RelationKind = 'provides' | 'requires' | 'dependency' | 'association' | 'link';

export interface ComponentEntity {
  id: string;
  label: string;
  stereotype?: string;
  parentId?: string;
  classes: string[];
  styles: string[];
  /** Ports declared directly on this component, in declaration order. */
  ports: string[];
  /** Components or packages nested directly inside this component/package. */
  children: string[];
}

export interface InterfaceEntity {
  id: string;
  label: string;
  parentId?: string;
  classes: string[];
  styles: string[];
}

export interface ActorEntity {
  id: string;
  label: string;
  stereotype?: string;
  classes: string[];
  styles: string[];
}

export interface PortEntity {
  id: string;
  label: string;
  parentId: string;
  classes: string[];
  styles: string[];
}

export interface PackageEntity {
  id: string;
  label: string;
  parentId?: string;
  classes: string[];
  styles: string[];
  children: string[];
}

export interface NoteEntity {
  id: string;
  target: string;
  label: string;
}

export interface Relation {
  id: string;
  source: string;
  target: string;
  kind: RelationKind;
  label?: string;
  classes: string[];
  styles: string[];
}

export interface ClassDef {
  id: string;
  styles: string[];
}

export type ComponentSymbolKind = 'component' | 'interface' | 'actor' | 'port' | 'package';

export interface ComponentFields {
  components: Map<string, ComponentEntity>;
  interfaces: Map<string, InterfaceEntity>;
  actors: Map<string, ActorEntity>;
  ports: Map<string, PortEntity>;
  packages: Map<string, PackageEntity>;
  notes: Map<string, NoteEntity>;
  relations: Relation[];
  classDefs: Map<string, ClassDef>;
  symbols: Map<string, ComponentSymbolKind>;
  direction: Direction;
  relationCounter: number;
  noteCounter: number;
  accTitle: string;
  accDescription: string;
  config: Required<ComponentDiagramConfig>;
}

export type ComponentLayoutNodeShape =
  | 'umlComponent'
  | 'umlInterface'
  | 'umlPort'
  | 'umlActor'
  | 'note';

export type ComponentLayoutNode = Omit<NonClusterNode, 'shape'> & {
  shape: ComponentLayoutNodeShape;
  stereotype?: string;
  noteTarget?: string;
  noteTargetLabel?: string;
};

export type ComponentLayoutCluster = ClusterNode & {
  shape: 'umlComponentGroup';
  boundaryType: 'rect' | 'package';
  stereotype?: string;
};

export interface ComponentLayoutEdge extends Edge {
  start: string;
  end: string;
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
  type: 'edge';
  relationKind: RelationKind | 'note';
  pattern: 'solid' | 'dotted';
  arrowTypeStart: string;
  arrowTypeEnd: string;
  internal: boolean;
  style: string[];
  cssCompiledStyles: string[];
  minlen: number;
}

export interface ComponentLayoutData extends Omit<LayoutData, 'nodes' | 'edges'> {
  nodes: (ComponentLayoutNode | ComponentLayoutCluster)[];
  edges: ComponentLayoutEdge[];
  config: MermaidConfig;
  type: 'component';
  layoutAlgorithm: string;
  direction: Direction;
  nodeSpacing: number;
  rankSpacing: number;
  diagramPadding: number;
  useMaxWidth: boolean;
  markers: ('point' | 'socket' | 'lollipop')[];
}

export interface ComponentDB extends DiagramDB {
  getConfig: () => Required<ComponentDiagramConfig>;

  getComponents: () => ReadonlyMap<string, ComponentEntity>;
  getComponent: (id: string) => ComponentEntity | undefined;
  getInterfaces: () => ReadonlyMap<string, InterfaceEntity>;
  getInterface: (id: string) => InterfaceEntity | undefined;
  getActors: () => ReadonlyMap<string, ActorEntity>;
  getPorts: () => ReadonlyMap<string, PortEntity>;
  getPort: (id: string) => PortEntity | undefined;
  getPackages: () => ReadonlyMap<string, PackageEntity>;
  getPackage: (id: string) => PackageEntity | undefined;
  getNotes: () => ReadonlyMap<string, NoteEntity>;
  getRelations: () => readonly Relation[];
  getClassDefs: () => ReadonlyMap<string, ClassDef>;
  getDirection: () => Direction;

  addComponent: (id: string, label?: string, stereotype?: string, parentId?: string) => void;
  addInterface: (id: string, label?: string, parentId?: string) => void;
  addActor: (id: string, label?: string, stereotype?: string) => void;
  addPort: (parentId: string, id: string) => void;
  addPackage: (id: string, parentId?: string) => void;
  addNote: (target: string, label: string) => void;
  addRelation: (source: string, target: string, kind: RelationKind, label?: string) => void;
  addClassDef: (id: string, styles: string[]) => void;
  setClasses: (ids: string[], className: string) => void;
  setStyles: (id: string, styles: string[]) => void;
  setDirection: (direction: Direction) => void;

  getData: () => ComponentLayoutData;
  clear: () => void;
}
