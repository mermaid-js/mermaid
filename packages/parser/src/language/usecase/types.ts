/**
 * Type definitions for ANTLR UseCase parser
 */

// Arrow types for usecase diagrams (similar to sequence diagram LINETYPE)
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

export type ActorMetadata = Record<string, string>;

export interface Actor {
  id: string;
  name: string;
  metadata?: ActorMetadata;
  styles?: string[]; // Direct CSS styles applied to this actor
}

export interface UseCase {
  id: string;
  name: string;
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

export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: 'association' | 'include' | 'extend';
  arrowType: ArrowType;
  label?: string;
}

export interface ClassDef {
  id: string;
  styles: string[];
}

export interface UsecaseParseResult {
  actors: Actor[];
  useCases: UseCase[];
  systemBoundaries: SystemBoundary[];
  relationships: Relationship[];
  classDefs?: Map<string, ClassDef>;
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
