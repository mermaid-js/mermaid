import type { DiagramDB } from '../../diagram-api/types.js';
import type { UsecaseDiagramConfig } from '../../config.type.js';

export type ActorMetadata = Record<string, string>;

export interface Actor {
  id: string;
  name: string;
  description?: string;
  metadata?: ActorMetadata;
}

export interface UseCase {
  id: string;
  name: string;
  description?: string;
  nodeId?: string; // Optional node ID (e.g., 'a' in 'a(Go through code)')
  systemBoundary?: string; // Optional reference to system boundary
}

export type SystemBoundaryType = 'package' | 'rect';

export interface SystemBoundary {
  id: string;
  name: string;
  useCases: string[]; // Array of use case IDs within this boundary
  type?: SystemBoundaryType; // Type of boundary rendering (default: 'rect')
}

// Arrow types for usecase diagrams (matching parser types)
export const ARROW_TYPE = {
  SOLID_ARROW: 0, // -->
  BACK_ARROW: 1, // <--
  LINE_SOLID: 2, // --
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

export interface UsecaseFields {
  actors: Map<string, Actor>;
  useCases: Map<string, UseCase>;
  systemBoundaries: Map<string, SystemBoundary>;
  relationships: Relationship[];
  config: Required<UsecaseDiagramConfig>;
}

export interface UsecaseDB extends DiagramDB {
  getConfig: () => Required<UsecaseDiagramConfig>;

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

  // Utility methods
  clear: () => void;
}
