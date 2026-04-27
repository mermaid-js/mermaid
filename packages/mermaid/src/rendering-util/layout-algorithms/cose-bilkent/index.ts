import { render as renderWithCoseBilkent } from './render.js';

/**
 * Cose-Bilkent Layout Algorithm for Generic Diagrams
 *
 * This module provides a layout algorithm implementation using Cytoscape
 * with the cose-bilkent algorithm for positioning nodes and edges.
 *
 * The algorithm follows the unified rendering pattern and can be used
 * by any diagram type that provides compatible LayoutData.
 */

/**
 * Render function for the cose-bilkent layout algorithm
 *
 * This function follows the unified rendering pattern used by all layout algorithms.
 * It takes LayoutData, inserts nodes into DOM, runs the cose-bilkent layout algorithm,
 * and renders the positioned elements to the SVG.
 *
 * @param layoutData - Layout data containing nodes, edges, and configuration
 * @param svg - SVG element to render to
 * @param helpers - Internal helper functions for rendering
 * @param options - Rendering options
 */
export const render = renderWithCoseBilkent;
