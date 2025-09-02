// AST types for usecase diagrams

export interface UsecaseDiagram {
  type: 'usecaseDiagram';
  statements: Statement[];
}

export type Statement = Actor | SystemBoundary | SystemBoundaryMetadata | Usecase | Relationship | ActorUseCaseRelationship | Node | ActorNodeRelationship | InlineActorNodeRelationship;

export interface Title {
  type: 'title';
  text: string;
}

export interface AccDescr {
  type: 'accDescr';
  text: string;
}

export interface AccTitle {
  type: 'accTitle';
  text: string;
}

export interface Actor {
  type: 'actor';
  name: string;
  metadata?: Record<string, string>;
}

export interface Usecase {
  type: 'usecase';
  name: string;
  alias?: string;
}

export interface SystemBoundary {
  type: 'systemBoundary';
  name: string;
  useCases: Usecase[];
  metadata?: Record<string, string>;
}

export interface SystemBoundaryMetadata {
  type: 'systemBoundaryMetadata';
  name: string; // boundary name
  metadata: Record<string, string>;
}

export interface ActorUseCaseRelationship {
  type: 'actorUseCaseRelationship';
  from: string; // actor name
  to: string;   // use case name
  arrow: string; // '-->' or '->'
  label?: string; // edge label (optional)
}

export interface Node {
  type: 'node';
  id: string;   // node ID (e.g., 'a', 'b', 'c')
  label: string; // node label (e.g., 'Go through code')
}

export interface ActorNodeRelationship {
  type: 'actorNodeRelationship';
  from: string; // actor name
  to: string;   // node ID
  arrow: string; // '-->' or '->'
  label?: string; // edge label (optional)
}

export interface InlineActorNodeRelationship {
  type: 'inlineActorNodeRelationship';
  actor: string; // actor name
  node: Node;    // node definition
  arrow: string; // '-->' or '->'
  label?: string; // edge label (optional)
}

export interface Relationship {
  type: 'relationship';
  from: string;
  to: string;
  relationshipType: RelationshipType;
  label?: string;
}

export interface Note {
  type: 'note';
  position: NotePosition;
  target: string;
  text: string;
}

export type RelationshipType = 
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-both'
  | 'extends'
  | 'includes';

export type NotePosition = 
  | 'left'
  | 'right'
  | 'top'
  | 'bottom';

// Parser result type
export interface ParseResult {
  success: boolean;
  ast?: UsecaseDiagram;
  errors?: string[];
}
