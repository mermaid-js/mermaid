import { log } from '../../logger.js';
import type { LayoutData } from '../../rendering-util/types.js';

/**
 * Shapes allowed in agentflow diagrams.
 * Includes both canonical names (from getTypeFromVertex) and
 * alias/shortName values (from shape metadata annotations).
 */
const ALLOWED_SHAPES = new Set([
  // Canonical names from getTypeFromVertex
  'roundedRect',
  'squareRect',
  'rect',
  'circle',
  'diamond',
  // Alias / shortName values from shape metadata
  'doc',
  'hexagon',
  'hex',
  'stadium',
  'terminal',
  'subroutine',
  'lean-right',
  'in-out',
  'lin-doc',
  'lined-document',
  'procs',
  // Directive/constraint shapes
  'trapezoid',
  'inv-trapezoid',
  'double-circle',
  // Collapsed container shape
  'collapsedGroup',
  // Type declaration shape
  'typeDeclaration',
]);
const DEFAULT_SHAPE = 'roundedRect';

/**
 * Transform flowchart-generated LayoutData into agentflow-specific form.
 * Called after the db produces layout data but before it reaches the renderer.
 */
export function transformData(data: LayoutData): void {
  for (const node of data.nodes) {
    // Group/cluster nodes use specific cluster shapes — don't override
    if (node.isGroup) {
      continue;
    }

    // Map rect/squareRect to rounded — agentflow default is rounded
    if (!node.shape || node.shape === 'squareRect') {
      node.shape = DEFAULT_SHAPE;
    }

    // Enforce allowed shapes
    if (!ALLOWED_SHAPES.has(node.shape)) {
      log.warn(`agentflow: shape "${node.shape}" is not supported, using "${DEFAULT_SHAPE}"`);
      node.shape = DEFAULT_SHAPE;
    }
  }
}
