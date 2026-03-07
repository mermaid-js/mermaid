/**
 * Bidirectional Tidy-Tree Layout Algorithm for Generic Diagrams
 *
 * This module provides a layout algorithm implementation using the
 * non-layered-tidy-tree-layout algorithm for positioning nodes and edges
 * in tree structures with a bidirectional approach.
 *
 * The algorithm creates two separate trees that grow horizontally in opposite
 * directions from a central root node:
 * - Left tree: grows horizontally to the left (children alternate: 1st, 3rd, 5th...)
 * - Right tree: grows horizontally to the right (children alternate: 2nd, 4th, 6th...)
 *
 * This creates a balanced, symmetric layout that is ideal for mindmaps,
 * organizational charts, and other tree-based diagrams.
 *
 * The algorithm follows the unified rendering pattern and can be used
 * by any diagram type that provides compatible LayoutData.
 */

/**
 * Render function for the bidirectional tidy-tree layout algorithm
 *
 * This function follows the unified rendering pattern used by all layout algorithms.
 * It takes LayoutData, inserts nodes into DOM, runs the bidirectional tidy-tree layout algorithm,
 * and renders the positioned elements to the SVG.
 *
 * Features:
 * - Alternates root children between left and right trees
 * - Left tree grows horizontally to the left (rotated 90° counterclockwise)
 * - Right tree grows horizontally to the right (rotated 90° clockwise)
 * - Uses tidy-tree algorithm for optimal spacing within each tree
 * - Creates symmetric, balanced layouts
 * - Maintains proper edge connections between all nodes
 *
 * Layout Structure:
 * ```
 * [Child 3] ← [Child 1] ← [Root] → [Child 2] → [Child 4]
 *     ↓           ↓                     ↓           ↓
 * [GrandChild]  [GrandChild]      [GrandChild]  [GrandChild]
 * ```
 *
 * @param layoutData - Layout data containing nodes, edges, and configuration
 * @param svg - SVG element to render to
 * @param helpers - Internal helper functions for rendering
 * @param options - Rendering options
 */
export { default } from './layouts.js';
export * from './types.js';
export * from './layout.js';
export { render } from './render.js';
