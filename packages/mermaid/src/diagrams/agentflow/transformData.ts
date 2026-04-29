import { log } from '../../logger.js';
import type { LayoutData } from '../../rendering-util/types.js';
import type { AgentFlowDB } from './agentflowDb.js';

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
  // Instance shapes (references to definitions)
  'tagged-rectangle',
  'tag-rect',
  'half-rounded-rectangle',
  'delay',
  'lined-rectangle',
  'lin-rect',
  'window-pane',
  'win-pane',
  'curved-trapezoid',
  'curv-trap',
  // Collapsed container shape
  'collapsedGroup',
  // Type declaration shape
  'typeDeclaration',
]);
const DEFAULT_SHAPE = 'roundedRect';

/**
 * Transform flowchart-generated LayoutData into agentflow-specific form.
 * Called after the db produces layout data but before it reaches the renderer.
 *
 * `db` is optional so callers can invoke `transformData` standalone (e.g.
 * in focused tests). When supplied, unsupported-shape warnings are emitted
 * as structured `AgentflowDiagnostic`s through `db.emitWarning` so
 * conformance fixtures and editor tooling can match on the
 * `SHAPE_UNSUPPORTED` message ID. When absent, the warning still reaches
 * the logger for console visibility.
 */
export function transformData(data: LayoutData, db?: AgentFlowDB): void {
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
      const msg = `shape "${node.shape}" is not supported, using "${DEFAULT_SHAPE}"`;
      if (db?.emitWarning) {
        db.emitWarning('SHAPE_UNSUPPORTED', msg, { nodeId: node.id });
      } else {
        log.warn(`agentflow: ${msg}`);
      }
      node.shape = DEFAULT_SHAPE;
    }
  }
}
