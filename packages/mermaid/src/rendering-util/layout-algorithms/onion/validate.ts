import type { ClusterNode, LayoutData, Node } from '../../types.js';
import {
  validateLayout,
  type Issue,
  type LayoutIssueType,
  type ValidateLayoutResult,
} from '../layout-utils/validateLayout.js';
import {
  boxIntersectsConvex,
  hexagonPolygon,
  outlineHitsBox,
  pointInConvex,
  type Vec,
} from './geometry.js';
import { nodeOutline } from './outline.js';
import { findSideGroupIds } from './structure.js';

/**
 * Checks of `validateLayout` that are written for orthogonal routing and do not apply to the
 * onion layout, whose edges are single straight segments in any direction:
 * - `edge-non-orthogonal`: every diagonal spoke is one by design.
 * - `edge-corner-connection`, `edge-border-hugging`, `node-border-hugging`: measured against
 *   axis-aligned sides that a straight edge only meets at an angle.
 */
const NOT_APPLICABLE: ReadonlySet<LayoutIssueType> = new Set([
  'edge-non-orthogonal',
  'edge-corner-connection',
  'edge-border-hugging',
  'node-border-hugging',
]);

/** How far from a drawn outline a point may sit and still count as on it, in px. */
const ON_OUTLINE = 0.5;

/** The hexagon a ring frame is painted as, in layout space. */
function frameOf(group: ClusterNode): Vec[] {
  return hexagonPolygon(group.width ?? 0, group.height ?? 0, group.hexagonPointDepth ?? 0).map(
    (p) => ({ x: (group.x ?? 0) + p.x, y: (group.y ?? 0) + p.y })
  );
}

function outlineOf(node: Node): Vec[] {
  return nodeOutline(node, node.width ?? 0, node.height ?? 0).map((p) => ({
    x: (node.x ?? 0) + p.x,
    y: (node.y ?? 0) + p.y,
  }));
}

/**
 * `validateLayout` reads every node as its bounding box and every group as a rectangle. Onion
 * edges end on a node's drawn outline, which for a slanted or pointed shape lies inside its box,
 * and its rings are hexagons. An issue that only exists because of that reading is dropped; the
 * same issue against the real outline is kept.
 */
function isBoxArtefact(issue: Issue, layout: LayoutData, byId: Map<string, Node>): boolean {
  const edge = layout.edges.find((e) => e.id === issue.edgeId);
  const node = byId.get(issue.nodeIds?.[0] ?? '');
  if (
    (issue.type === 'edge-endpoint-inside-node' || issue.type === 'edge-intersects-obstacle') &&
    edge?.points &&
    node &&
    (node.id === edge.start || node.id === edge.end)
  ) {
    // The edge's own end node: fine when the end lies on that node's drawn outline.
    const end = node.id === edge.start ? edge.points[0] : edge.points.at(-1)!;
    const outline = outlineOf(node);
    return pointInConvex(outline, end, -ON_OUTLINE) && !pointInConvex(outline, end, ON_OUTLINE);
  }
  if (issue.type === 'node-overlap') {
    // A ring and a leaf outside it: fine when the leaf sits in a corner of the ring's box,
    // outside the hexagon actually painted.
    const pair = (issue.nodeIds ?? []).map((id) => byId.get(id));
    const ring = pair.find(
      (n): n is ClusterNode => !!n?.isGroup && n.hexagonPointDepth !== undefined
    );
    const leaf = pair.find((n) => n && !n.isGroup);
    if (!ring || !leaf) {
      return false;
    }
    const box = {
      x: leaf.x ?? 0,
      y: leaf.y ?? 0,
      width: leaf.width ?? 0,
      height: leaf.height ?? 0,
    };
    return !boxIntersectsConvex(box, frameOf(ring));
  }
  if (issue.type === 'edge-label-overlaps-group-border' && edge) {
    const groupId = issue.details?.groupId;
    const group = byId.get(typeof groupId === 'string' ? groupId : (issue.nodeIds?.at(-1) ?? ''));
    if (!group?.isGroup) {
      return false;
    }
    if (group.hexagonPointDepth === undefined) {
      // A side group: laid out, never painted (see `findSideGroupIds`).
      return findSideGroupIds(layout.nodes).has(group.id);
    }
    const frame = frameOf(group);
    const label = {
      x: edge.x ?? 0,
      y: edge.y ?? 0,
      width: edge.width ?? 0,
      height: edge.height ?? 0,
    };
    return !outlineHitsBox(frame, label);
  }
  return false;
}

/**
 * `validateLayout` with the checks that apply to the onion layout: the ones in `NOT_APPLICABLE`
 * are left out, and box and rectangle readings are checked against the drawn outlines instead.
 * The score is recomputed from the remaining issues, as `validateLayout` computes it.
 */
export function validateOnionLayout(layout: LayoutData): ValidateLayoutResult {
  const result = validateLayout(layout);
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  const issues = result.issues.filter(
    (issue) => !NOT_APPLICABLE.has(issue.type) && !isBoxArtefact(issue, layout, byId)
  );
  const ok = issues.length === 0;
  const penalty = result.breakdown.totalBendPenalty + result.breakdown.crossingPenalty;
  return { ...result, ok, issues, score: ok ? Math.max(0, 1000 - penalty) : 0 };
}
