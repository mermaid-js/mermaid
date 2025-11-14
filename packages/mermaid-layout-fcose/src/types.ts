import type { LayoutData } from 'mermaid';

export type Node = LayoutData['nodes'][number];
export type Edge = LayoutData['edges'][number];

/**
 * Positioned node after layout calculation
 */
export interface PositionedNode {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  originalNode?: Node;
  [key: string]: unknown;
}

/**
 * Positioned edge after layout calculation
 */
export interface PositionedEdge {
  id: string;
  source: string;
  target: string;
  points: { x: number; y: number }[];
  [key: string]: unknown;
}

/**
 * Result of layout algorithm execution
 */
export interface LayoutResult {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
}

/**
 * Architecture-specific data structures for fcose layout
 */
export type ArchitectureSpatialMap = Record<string, number[]>;

export type ArchitectureAlignment = 'vertical' | 'horizontal' | 'bend';

export type ArchitectureGroupAlignments = Record<
  string,
  Record<string, Exclude<ArchitectureAlignment, 'bend'>>
>;

export interface ArchitectureDataStructures {
  spatialMaps: ArchitectureSpatialMap[];
  groupAlignments: ArchitectureGroupAlignments;
}
