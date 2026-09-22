/**
 * Agentflow's shape vocabulary — the single source of truth for the §4.3
 * aliases, the shapes v0.8.1 removed, and the shapes it allows.
 *
 * This used to be duplicated between `agentflowDb.ts` (alias resolution at
 * `addVertex` time) and `transformData.ts` (validation at render time), and the
 * two copies had already drifted.
 */
import { log } from '../../logger.js';

/**
 * v0.8.1 shape aliases (§4.3.2). Author-friendly names map to canonical Mermaid
 * shape IDs. `round` is a forgiving legacy alias of `rect`, which the render
 * pass then normalises to {@link DEFAULT_SHAPE}.
 */
export const SHAPE_ALIASES: ReadonlyMap<string, string> = new Map([
  ['task', 'roundedRect'],
  ['tool', 'subroutine'],
  ['input', 'lean-right'],
  ['decision', 'diamond'],
  ['refdoc', 'lin-doc'],
  ['action', 'hexagon'],
  ['round', 'rect'],
]);

/**
 * Shapes that are *removed* in v0.8.1 (§4.3.3). Authoring any of these is a hard
 * error (`SHAPE_REMOVED`); the node is coerced to {@link DEFAULT_SHAPE} rather
 * than crashing the render.
 */
export const REMOVED_SHAPES: ReadonlySet<string> = new Set([
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
 * Shapes the v0.8.1 spec allows authors to use, as canonical Mermaid shape IDs
 * after alias resolution. `rect`/`squareRect` are normalised to
 * {@link DEFAULT_SHAPE} before this set is consulted, so they are not listed.
 */
export const ALLOWED_SHAPES: ReadonlySet<string> = new Set([
  'roundedRect',
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
]);

export const DEFAULT_SHAPE = 'roundedRect';

/**
 * Resolve a shape name (alias or canonical) to its canonical Mermaid shape ID.
 * Returns the input unchanged when no alias matches.
 */
export function resolveShapeAlias(shape: string | undefined): string | undefined {
  if (!shape) {
    return shape;
  }
  return SHAPE_ALIASES.get(shape) ?? shape;
}

/** Minimal diagnostic sink, so this module does not have to know about the DB. */
export interface ShapeDiagnosticSink {
  emitError?: (id: 'SHAPE_REMOVED', message: string, ctx: { nodeId: string }) => void;
  emitWarning?: (id: 'SHAPE_UNSUPPORTED', message: string, ctx: { nodeId: string }) => void;
}

interface ShapedNode {
  id: string;
  shape?: string;
  isGroup?: boolean;
}

/**
 * Normalise every node's shape to a canonical, supported ID, reporting removed
 * and unsupported shapes through `sink`. Group nodes keep their cluster shape.
 */
export function normaliseNodeShapes(nodes: ShapedNode[], sink?: ShapeDiagnosticSink): void {
  for (const node of nodes) {
    // Group/cluster nodes use specific cluster shapes — don't override
    if (node.isGroup) {
      continue;
    }

    // Map rect/squareRect (incl. the `round` → `rect` alias) to the canonical
    // rounded default.
    if (!node.shape || node.shape === 'squareRect' || node.shape === 'rect') {
      node.shape = DEFAULT_SHAPE;
    }

    if (REMOVED_SHAPES.has(node.shape)) {
      const msg = `shape "${node.shape}" was removed in v0.8.1, using "${DEFAULT_SHAPE}"`;
      if (sink?.emitError) {
        sink.emitError('SHAPE_REMOVED', msg, { nodeId: node.id });
      } else {
        log.warn(`agentflow: ${msg}`);
      }
      node.shape = DEFAULT_SHAPE;
      continue;
    }

    if (!ALLOWED_SHAPES.has(node.shape)) {
      const msg = `shape "${node.shape}" is not supported, using "${DEFAULT_SHAPE}"`;
      if (sink?.emitWarning) {
        sink.emitWarning('SHAPE_UNSUPPORTED', msg, { nodeId: node.id });
      } else {
        log.warn(`agentflow: ${msg}`);
      }
      node.shape = DEFAULT_SHAPE;
    }
  }
}
