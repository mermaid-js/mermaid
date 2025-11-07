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
  section?: 'root' | 'left' | 'right';
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
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  sourceSection?: 'root' | 'left' | 'right';
  targetSection?: 'root' | 'left' | 'right';
  sourceWidth?: number;
  sourceHeight?: number;
  targetWidth?: number;
  targetHeight?: number;
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
 * Tidy-tree node structure compatible with non-layered-tidy-tree-layout
 */
export interface TidyTreeNode {
  id: string | number;
  width: number;
  height: number;
  x?: number;
  y?: number;
  children?: TidyTreeNode[];
  _originalNode?: Node;
}

/**
 * Tidy-tree layout configuration
 */
export interface TidyTreeLayoutConfig {
  gap: number;
  bottomPadding: number;
}
