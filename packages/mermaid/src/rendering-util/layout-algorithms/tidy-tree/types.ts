import type { Node } from '../../types.js';

/**
 * Positioned node after layout calculation
 */
export interface PositionedNode {
  id: string;
  x: number;
  y: number;
  // Tree membership information for edge calculations
  section?: 'root' | 'left' | 'right';
  // Original node dimensions for edge point calculations
  width?: number;
  height?: number;
  // Reference to original node for additional data
  originalNode?: Node;
  [key: string]: unknown; // Allow additional properties
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
  // Tree membership information for edge styling/routing
  sourceSection?: 'root' | 'left' | 'right';
  targetSection?: 'root' | 'left' | 'right';
  // Node dimensions for precise edge point calculations
  sourceWidth?: number;
  sourceHeight?: number;
  targetWidth?: number;
  targetHeight?: number;
  [key: string]: unknown; // Allow additional properties
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
  _originalNode?: Node; // Store reference to original node data
}

/**
 * Tidy-tree layout configuration
 */
export interface TidyTreeLayoutConfig {
  gap: number; // Horizontal gap between nodes
  bottomPadding: number; // Vertical gap between levels
}
