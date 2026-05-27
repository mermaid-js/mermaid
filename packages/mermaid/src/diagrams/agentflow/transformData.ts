import { log } from '../../logger.js';
import type { LayoutData } from '../../rendering-util/types.js';
import type { AgentFlowDB } from './agentflowDb.js';

/**
 * v0.8.1 author-friendly shape aliases (§4.3.2). The alias is the
 * recommended authoring name; the canonical Mermaid shape ID on the right
 * is what flows on through the renderer. The DB applies the mapping at
 * `addVertex` time so by the time the data hits this transform, only
 * canonical names appear.
 *
 * Kept here for reference only; the live resolver lives in agentflowDb.ts.
 */
export const SHAPE_ALIASES: ReadonlyMap<string, string> = new Map([
  ['task', 'roundedRect'],
  ['tool', 'subroutine'],
  ['input', 'lean-right'],
  ['decision', 'diamond'],
  ['refdoc', 'lin-doc'],
  ['action', 'hexagon'],
]);

/**
 * Shapes that are *removed* in v0.8.1 (§4.3.3). Authoring any of these
 * shapes is a hard error (`SHAPE_REMOVED`). The DB raises the diagnostic;
 * if a removed shape still leaks through to the transform layer we coerce
 * to the default rather than crash the render.
 */
const REMOVED_SHAPES = new Set<string>([
  'doc',
  'stadium',
  'terminal',
  'circle',
  'trapezoid',
  'inv_trapezoid',
  'inv-trapezoid',
  'doublecircle',
  'double-circle',
  'typeDeclaration',
  'procs',
  'lean_left',
  'lean-left',
  'in-out',
  'cylinder',
  'ellipse',
  'odd',
  // Instance shapes — instancing mechanism removed entirely.
  'tag-rect',
  'tagged-rectangle',
  'delay',
  'half-rounded-rectangle',
  'lin-rect',
  'lined-rectangle',
  'win-pane',
  'window-pane',
  'curv-trap',
  'curved-trapezoid',
]);

/**
 * Shapes the v0.8.1 spec allows authors to use. These are the canonical
 * Mermaid shape IDs after alias resolution; aliases (`task`, `tool`, etc.)
 * are mapped to one of these before the shape reaches this point.
 */
const ALLOWED_SHAPES = new Set<string>([
  // Default + task aliases
  'roundedRect',
  'squareRect',
  'rect',
  // Other v0.8.1 shapes
  'subroutine',
  'subprocess',
  'subproc',
  'framed-rectangle',
  'lean-right',
  'diamond',
  'lin-doc',
  'lined-document',
  'hexagon',
  'hex',
  'connector',
  // Collapsed flow container
  'collapsedGroup',
  // `round` accepted as an alias of `rect` (forgiving authoring).
  'round',
]);

const DEFAULT_SHAPE = 'roundedRect';

/**
 * Transform flowchart-generated LayoutData into agentflow-specific form.
 * Called after the db produces layout data but before it reaches the
 * renderer.
 *
 * `db` is optional so callers can invoke `transformData` standalone (e.g.
 * in focused tests). When supplied, removed/unsupported-shape warnings are
 * emitted as structured `AgentflowDiagnostic`s through `db.emitWarning` so
 * conformance fixtures and editor tooling can match on the message ID.
 */
export function transformData(data: LayoutData, db?: AgentFlowDB): void {
  for (const node of data.nodes) {
    // Group/cluster nodes use specific cluster shapes — don't override
    if (node.isGroup) {
      continue;
    }

    // Map rect/squareRect/round to the canonical rounded default.
    if (!node.shape || node.shape === 'squareRect' || node.shape === 'round') {
      node.shape = DEFAULT_SHAPE;
    }

    if (REMOVED_SHAPES.has(node.shape)) {
      const msg = `shape "${node.shape}" was removed in v0.8.1, using "${DEFAULT_SHAPE}"`;
      if (db?.emitError) {
        db.emitError('SHAPE_REMOVED', msg, { nodeId: node.id });
      } else {
        log.warn(`agentflow: ${msg}`);
      }
      node.shape = DEFAULT_SHAPE;
      continue;
    }

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
