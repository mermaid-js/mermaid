/**
 * Type definitions for ANTLR UseCase parser
 */

// Arrow types for usecase diagrams (similar to sequence diagram LINETYPE)
export const ARROW_TYPE = {
  SOLID_ARROW: 0, // -->
  BACK_ARROW: 1, // <--
  LINE_SOLID: 2, // --
} as const;

export type ArrowType = (typeof ARROW_TYPE)[keyof typeof ARROW_TYPE];

export type ActorMetadata = Record<string, string>;

export interface Actor {
  id: string;
  name: string;
  metadata?: ActorMetadata;
}

export interface UseCase {
  id: string;
  name: string;
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

export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: 'association' | 'include' | 'extend';
  arrowType: ArrowType;
  label?: string;
}

export interface UsecaseParseResult {
  actors: Actor[];
  useCases: UseCase[];
  systemBoundaries: SystemBoundary[];
  relationships: Relationship[];
  direction?: string;
  accDescr?: string;
  accTitle?: string;
  title?: string;
}

/**
 * ANTLR Parser Services interface
 */
export interface AntlrUsecaseServices {
  parser: AntlrUsecaseParser;
  visitor: any; // UsecaseAntlrVisitor - using any to avoid circular dependency
}

/**
 * ANTLR Parser interface
 */
export interface AntlrUsecaseParser {
  parse(input: string): UsecaseParseResult;
}
