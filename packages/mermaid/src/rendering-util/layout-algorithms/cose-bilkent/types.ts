/**
 * Positioned node after layout calculation
 */
export interface PositionedNode {
  id: string;
  x: number;
  y: number;
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
 * Cytoscape layout configuration
 */
export interface CytoscapeLayoutConfig {
  name: 'cose-bilkent';
  quality: 'proof';
  styleEnabled: boolean;
  animate: boolean;
}
