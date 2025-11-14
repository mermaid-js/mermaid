/**
 * FCoSE Layout Algorithm for Architecture Diagrams
 *
 * This module provides a layout algorithm implementation using the
 * cytoscape-fcose algorithm for positioning nodes and edges in architecture
 * diagrams with spatial constraints and group alignments.
 *
 * The algorithm is optimized for architecture diagrams and supports:
 * - Spatial maps for relative positioning
 * - Group alignments for organizing related services
 * - XY edges with 90-degree bends
 * - Complex edge routing
 *
 * The algorithm follows the unified rendering pattern and can be used
 * by architecture diagrams that provide compatible LayoutData with
 * architecture-specific data structures.
 */

export { default } from './layouts.js';
export * from './types.js';
export * from './layout.js';
export { render } from './render.js';
