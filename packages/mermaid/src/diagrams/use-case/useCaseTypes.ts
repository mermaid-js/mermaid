import type { DiagramDB } from '../../diagram-api/types.js';
import type { D3Element } from '../../types.js';
import type { UseCaseDiagramConfig } from '../../config.type.js';

/*============================*
|      Use Case Diagram      |
\*============================*/

export type ActorPosition = 'left' | 'right';

export interface UseCaseActor {
  id: string;
  type: 'actor';
  position?: ActorPosition;
  label: string;
}

export interface UseCaseNode {
  id: string;
  // eslint-disable-next-line @cspell/spellchecker
  type: 'usecase';
  label: string;
  in?: string; // For future grouping if needed
}

export interface UseCaseEdge {
  from: string;
  to: string;
  title?: string;
}

export interface UseCaseState extends Record<string, unknown> {
  actors: Record<string, UseCaseActor>;
  useCases: Record<string, UseCaseNode>;
  edges: UseCaseEdge[];
  elements: Record<string, D3Element>;
  config: UseCaseDiagramConfig;
}

export interface UseCaseDB extends DiagramDB {
  clear: () => void;
  addActor: (actor: UseCaseActor) => void;
  addUseCase: (node: UseCaseNode) => void;
  addEdge: (edge: UseCaseEdge) => void;
  getActors: () => UseCaseActor[];
  getUseCases: () => UseCaseNode[];
  getEdges: () => UseCaseEdge[];
  setElementForId: (id: string, el: D3Element) => void;
  getElementById: (id: string) => D3Element;
}

export interface UseCaseStyleOptions {
  actorBorderColor: string;
  actorBorderWidth: string;
  actorFillColor: string;
  useCaseBorderColor: string;
  useCaseBorderWidth: string;
  useCaseFillColor: string;
  edgeColor: string;
  edgeWidth: string;
  fontSize: string;
  labelColor: string;
}
