/**
 * Compound (per-group) DOMUS placement candidate.
 *
 * The main DOMUS placement is flat: every leaf enters one SAT instance and
 * group edges are proxied onto leaves (`conversion.ts`), so members of
 * different groups interleave freely. On deeply nested fixtures (e.g.
 * `domus/architecture`, 4 nesting levels) the recomputed group frames then
 * overlap half the drawing and routing fails en masse.
 *
 * Paper background (NotebookLM `Papers`): DOMUS itself is flat-only — the
 * authors only note the SAT can hard-code directional variables per subgraph.
 * Siebenhaller's Constraint-Kandinsky solves clusters globally inside a full
 * TSM framework Mermaid does not have; the OGDF `ClusterPlanarizationLayout`
 * baseline instead runs a bottom-up per-cluster pass before global routing.
 * This pass is that OGDF-adjacent adaptation: DOMUS placement per group on
 * its *immediate* children (child groups collapsed to sized super-vertices,
 * per Siebenhaller's compound-vertex idea), composed top-down into clean
 * nested rectangles, then routed globally on fixed positions. The papers
 * warn recursive layouts cost crossings vs. global optimisation, so the
 * result is only a *candidate*: it replaces the flat geometry solely when
 * the unified validator scores it strictly better.
 *
 * Two Mermaid-specific adaptations DOMUS cannot express:
 * - DOMUS shapes are edge-driven, so an edge-less member has no constraint
 *   and whole levels collapse onto one point. Levels are therefore placed per
 *   connected component (DOMUS inside each component) and the component boxes
 *   are shelf-packed.
 * - Edge-label dummy nodes skew the per-level SAT (they sit mid-edge, not in
 *   the flow). They are excluded from placement and seeded at the midpoint of
 *   their semantic endpoints, then de-overlapped by the label nudgers before
 *   routing.
 */
import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/index.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import type { LayoutData, Node } from '../../../types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';
import { validateLayout } from '../validateLayoutProxy.js';
import { runDomusRouting } from '../domus/index.js';
import { applyLayeredPlacementFallback } from './layeredPlacementFallback.js';
import { inferEdgeLabelParentIds } from './labelParents.js';
import { preprocessClusters } from '../cluster.js';
import { finalizeDummyLabelNodesToOverlayLabels } from '../finalizeOverlayLabels.js';
import { isEdgeLabelNode } from '../core/labels.js';
import { nudgeEdgeLabelNodesToAvoidOverlaps } from '../labelNudging.js';
import { applyPortDirectionStubs } from './portStubs.js';
import { applyStraightCollapsePass } from './straightCollapsePass.js';
import { liftObstacleIntersectingSegments } from './obstacleLiftPass.js';
import { applyObstacleDetourInsertPass } from './obstacleDetourInsertPass.js';
import { snapEndpointsToBoundaries } from './snapEndpointsToBoundaries.js';
import { repairShortEndpointStubs } from './endpointStubRepair.js';
import { repairEndpointApproachesWhenIssuesImprove } from './endpointExteriorRepair.js';
import { repairNonOrthogonalEdgesWhenIssuesImprove } from './nonOrthogonalRepairPass.js';

/**
 * Gap between a group's children and its frame. The router inflates every
 * obstacle by `clearance` (= spacing = 10) on both sides, so a frame ring
 * needs more than 2*clearance + spacing to host a route; the default 15 leaves nested
 * boundary hops with zero routable space (every segment search returns null
 * and falls back to a blind L-shape). This padding is passed to every
 * `preprocessClusters` call in the candidate pipeline.
 */
export const COMPOUND_GROUP_PAD = 40;
const GROUP_PAD = COMPOUND_GROUP_PAD;

/**
 * Extra routing margin a group's box claims during parent-level placement,
 * materialising as an empty corridor outside every group frame.
 */
const GROUP_ROUTING_MARGIN = 30;

/** Internal level id for the forest of parent-less nodes. */
const ROOT_LEVEL = ' root';

interface InducedEdge {
  id: string;
  from: string;
  to: string;
  /** Set when cycle removal flipped this edge; direction is no longer semantic. */
  reversed?: boolean;
}

interface LevelResult {
  /** Content bbox size (children only, no padding). */
  contentWidth: number;
  contentHeight: number;
  /** Member centre offsets relative to the content bbox centre. */
  relByMemberId: Map<string, { dx: number; dy: number }>;
}

function cloneLayoutForCandidate(layout: LayoutData): LayoutData {
  return {
    ...layout,
    nodes: (layout.nodes ?? []).map((node) => ({
      ...(node as unknown as Record<string, unknown>),
    })) as unknown as LayoutData['nodes'],
    edges: (layout.edges ?? []).map((edge) => ({
      ...(edge as unknown as Record<string, unknown>),
      points: edge.points?.map((point) => ({ x: point.x, y: point.y })),
    })) as unknown as LayoutData['edges'],
  };
}

function copyLayoutGeometry(target: LayoutData, source: LayoutData): void {
  target.nodes = source.nodes;
  target.edges = source.edges;
}

/**
 * Reverse DFS back-edges so each per-level induced graph is acyclic before it
 * enters the SAT (same Sugiyama-style cycle removal the flat path applies),
 * then drop duplicate directed pairs.
 */
function toAcyclicDedupedEdges(vertexIds: readonly string[], edges: InducedEdge[]): InducedEdge[] {
  const adj = new Map<string, InducedEdge[]>();
  for (const v of vertexIds) {
    adj.set(v, []);
  }
  for (const e of edges) {
    adj.get(e.from)?.push(e);
  }

  const reversedIds = new Set<string>();
  const visited = new Set<string>();
  const stack = new Set<string>();
  const dfs = (u: string): void => {
    visited.add(u);
    stack.add(u);
    for (const e of adj.get(u) ?? []) {
      if (stack.has(e.to)) {
        reversedIds.add(e.id);
      } else if (!visited.has(e.to)) {
        dfs(e.to);
      }
    }
    stack.delete(u);
  };
  for (const v of vertexIds) {
    if (!visited.has(v)) {
      dfs(v);
    }
  }

  const seen = new Set<string>();
  const out: InducedEdge[] = [];
  for (const e of edges) {
    const oriented = reversedIds.has(e.id)
      ? { id: e.id, from: e.to, to: e.from, reversed: true }
      : e;
    const key = `${oriented.from} ${oriented.to}`;
    if (oriented.from === oriented.to || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(oriented);
  }
  return out;
}

interface PlacedBox {
  id: string;
  width: number;
  height: number;
  /** Centre relative to the component bbox top-left. */
  cx: number;
  cy: number;
}

/**
 * Flow-direction relation for per-level SAT constraints. Mirrors
 * `directionConstraints.ts` (the encoder's above/below semantics are inverted
 * vs. screen coordinates — TB flow needs `below`).
 */
function relationForDirection(raw: unknown): 'above' | 'below' | 'left-of' | 'right-of' | null {
  const d = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  switch (d) {
    case 'TB':
    case 'TD':
      return 'above';
    case 'BT':
    case 'DT':
      return 'below';
    case 'LR':
      return 'left-of';
    case 'RL':
      return 'right-of';
    default:
      return null;
  }
}

/** Place one connected component's members; returns boxes with centres relative to the component bbox top-left. */
function placeComponent(
  members: { id: string; width: number; height: number }[],
  edges: InducedEdge[],
  spacing: number,
  relation: 'above' | 'below' | 'left-of' | 'right-of' | null
): { boxes: PlacedBox[]; width: number; height: number } {
  const subNodes = members.map(
    (m) => ({ id: m.id, width: m.width, height: m.height, x: 0, y: 0 }) as Node
  );
  if (members.length > 1 && edges.length > 0) {
    const subLayout = { nodes: subNodes, edges: [], config: {} } as unknown as LayoutData;
    // Only never-reversed edges carry the semantic flow direction; an edge
    // flipped by cycle removal would encode the OPPOSITE relation and force
    // anti-flow placements (observed: Edge group below VPC). Same philosophy
    // as `buildDirectionPositionConstraints`' SCC exclusion.
    const positionConstraints = relation
      ? edges.filter((e) => !e.reversed).map((e) => ({ from: e.from, to: e.to, relation }))
      : [];
    const placement = runDomusRouting(subLayout, {
      spacing,
      useExistingPositions: false,
      placementOnly: true,
      edgesOverride: edges,
      constraints:
        positionConstraints.length > 0 ? { preferVertical: true, positionConstraints } : undefined,
    });
    if (!placement.success) {
      applyLayeredPlacementFallback(
        subLayout,
        { vertexIds: subNodes.map((n) => String(n.id)), edgesLayout: edges },
        { xStep: Math.max(120, spacing * 12), yStep: Math.max(120, spacing * 12) }
      );
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of subNodes) {
    const w = n.width ?? 40;
    const h = n.height ?? 40;
    minX = Math.min(minX, (n.x ?? 0) - w / 2);
    maxX = Math.max(maxX, (n.x ?? 0) + w / 2);
    minY = Math.min(minY, (n.y ?? 0) - h / 2);
    maxY = Math.max(maxY, (n.y ?? 0) + h / 2);
  }
  const boxes: PlacedBox[] = subNodes.map((n) => ({
    id: String(n.id),
    width: n.width ?? 40,
    height: n.height ?? 40,
    cx: (n.x ?? 0) - minX,
    cy: (n.y ?? 0) - minY,
  }));
  return { boxes, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

/**
 * Shelf-pack component boxes left-to-right into rows. Returns each
 * component's top-left offset within the packed content box.
 */
function shelfPack(
  comps: { width: number; height: number }[],
  gap: number
): { offsets: { x: number; y: number }[]; width: number; height: number } {
  const totalArea = comps.reduce((acc, c) => acc + c.width * c.height, 0);
  const widest = comps.reduce((acc, c) => Math.max(acc, c.width), 0);
  const targetWidth = Math.max(widest, Math.sqrt(totalArea) * 1.4);

  const offsets: { x: number; y: number }[] = new Array(comps.length);
  const order = comps
    .map((c, i) => ({ c, i }))
    .sort((a, b) => b.c.height - a.c.height || b.c.width - a.c.width || a.i - b.i);

  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let maxRight = 0;
  for (const { c, i } of order) {
    if (x > 0 && x + c.width > targetWidth) {
      x = 0;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    offsets[i] = { x, y };
    rowHeight = Math.max(rowHeight, c.height);
    maxRight = Math.max(maxRight, x + c.width);
    x += c.width + gap;
  }
  return { offsets, width: Math.max(1, maxRight), height: Math.max(1, y + rowHeight) };
}

/**
 * Bottom-up compound placement. Mutates leaf/label-dummy/group positions in
 * `candidate`. Returns false when the hierarchy could not be placed.
 */
function applyCompoundPlacement(candidate: LayoutData, spacing: number): boolean {
  const relation = relationForDirection((candidate as { direction?: unknown }).direction);
  const nodesById = new Map<string, Node>();
  for (const n of candidate.nodes ?? []) {
    if (n?.id != null) {
      nodesById.set(String(n.id), n);
    }
  }

  // Label dummies need a group context before levels are formed.
  inferEdgeLabelParentIds(nodesById, (candidate.edges ?? []) as never);

  const levelIdForNode = (n: Node): string => {
    const pid = n.parentId != null ? String(n.parentId) : null;
    if (pid && nodesById.get(pid)?.isGroup) {
      return pid;
    }
    return ROOT_LEVEL;
  };

  const membersByLevel = new Map<string, Node[]>();
  for (const n of candidate.nodes ?? []) {
    if (n?.id == null) {
      continue;
    }
    const level = levelIdForNode(n);
    const arr = membersByLevel.get(level) ?? [];
    arr.push(n);
    membersByLevel.set(level, arr);
  }

  // Semantic edges: label-split chains (A -> dummy -> B) collapse back to
  // (A, B) so connectivity survives the dummies' exclusion from placement.
  const dummyIn = new Map<string, string[]>();
  const dummyOut = new Map<string, string[]>();
  const directEdges: InducedEdge[] = [];
  for (const e of candidate.edges ?? []) {
    if (e?.id == null || e.start == null || e.end == null) {
      continue;
    }
    const s = String(e.start);
    const t = String(e.end);
    const sDummy = isEdgeLabelNode(nodesById.get(s));
    const tDummy = isEdgeLabelNode(nodesById.get(t));
    if (!sDummy && !tDummy) {
      directEdges.push({ id: String(e.id), from: s, to: t });
    } else if (tDummy && !sDummy) {
      const arr = dummyIn.get(t) ?? [];
      arr.push(s);
      dummyIn.set(t, arr);
    } else if (sDummy && !tDummy) {
      const arr = dummyOut.get(s) ?? [];
      arr.push(t);
      dummyOut.set(s, arr);
    }
  }
  const semanticEdges: InducedEdge[] = [...directEdges];
  const dummyEndpoints = new Map<string, { from: string; to: string }>();
  for (const [dummyId, sources] of dummyIn) {
    const targets = dummyOut.get(dummyId) ?? [];
    for (const s of sources) {
      for (const t of targets) {
        semanticEdges.push({ id: dummyId, from: s, to: t });
        if (!dummyEndpoints.has(dummyId)) {
          dummyEndpoints.set(dummyId, { from: s, to: t });
        }
      }
    }
  }

  // Deepest groups first, root last, so child-group sizes exist before parents.
  const groupDepth = (id: string): number => {
    let d = 0;
    let cur = nodesById.get(id);
    const seen = new Set<string>();
    while (cur?.parentId != null && !seen.has(String(cur.parentId))) {
      seen.add(String(cur.parentId));
      const p = nodesById.get(String(cur.parentId));
      if (!p?.isGroup) {
        break;
      }
      d++;
      cur = p;
    }
    return d;
  };
  const levelIds = [...membersByLevel.keys()].sort((a, b) => {
    if (a === ROOT_LEVEL) {
      return 1;
    }
    if (b === ROOT_LEVEL) {
      return -1;
    }
    const da = groupDepth(a);
    const db = groupDepth(b);
    if (da !== db) {
      return db - da;
    }
    return a.localeCompare(b);
  });

  // Member lookup: nodeId -> its representative member at a given level.
  const memberAtLevel = (nodeId: string, levelId: string): string | null => {
    let cur = nodesById.get(nodeId);
    const seen = new Set<string>();
    while (cur) {
      const curId = String(cur.id);
      if (levelIdForNode(cur) === levelId) {
        return curId;
      }
      const pid = cur.parentId != null ? String(cur.parentId) : null;
      if (!pid || seen.has(pid)) {
        return null;
      }
      seen.add(pid);
      cur = nodesById.get(pid);
    }
    return null;
  };

  const results = new Map<string, LevelResult>();
  const sizeForMember = (m: Node): { w: number; h: number } => {
    if (m.isGroup) {
      const r = results.get(String(m.id));
      if (r) {
        const pad = 2 * (GROUP_PAD + GROUP_ROUTING_MARGIN);
        return { w: r.contentWidth + pad, h: r.contentHeight + pad };
      }
    }
    return { w: m.width ?? 40, h: m.height ?? 40 };
  };

  for (const levelId of levelIds) {
    const members = membersByLevel.get(levelId) ?? [];
    const realMembers = members.filter((m) => !isEdgeLabelNode(m));
    const dummyMembers = members.filter((m) => isEdgeLabelNode(m));
    if (realMembers.length === 0 && dummyMembers.length === 0) {
      continue;
    }

    const rel = new Map<string, { dx: number; dy: number }>();

    if (realMembers.length === 0) {
      // Degenerate: a level of only label dummies. Stack them.
      let yCursor = 0;
      let maxW = 1;
      for (const d of dummyMembers) {
        const h = d.height ?? 20;
        rel.set(String(d.id), { dx: 0, dy: yCursor + h / 2 });
        yCursor += h + spacing;
        maxW = Math.max(maxW, d.width ?? 40);
      }
      const contentHeight = Math.max(1, yCursor - spacing);
      for (const [, v] of rel) {
        v.dy -= contentHeight / 2;
      }
      results.set(levelId, { contentWidth: maxW, contentHeight, relByMemberId: rel });
      continue;
    }

    const memberIds = new Set(realMembers.map((m) => String(m.id)));
    const induced: InducedEdge[] = [];
    for (const e of semanticEdges) {
      const from = memberAtLevel(e.from, levelId);
      const to = memberAtLevel(e.to, levelId);
      if (!from || !to || from === to || !memberIds.has(from) || !memberIds.has(to)) {
        continue;
      }
      induced.push({ id: e.id, from, to });
    }

    // Connected components over the induced graph.
    const compIndexById = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    for (const e of induced) {
      (adjacency.get(e.from) ?? adjacency.set(e.from, []).get(e.from)!).push(e.to);
      (adjacency.get(e.to) ?? adjacency.set(e.to, []).get(e.to)!).push(e.from);
    }
    let compCount = 0;
    for (const m of realMembers) {
      const id = String(m.id);
      if (compIndexById.has(id)) {
        continue;
      }
      const stack = [id];
      compIndexById.set(id, compCount);
      while (stack.length > 0) {
        const cur = stack.pop()!;
        for (const nb of adjacency.get(cur) ?? []) {
          if (!compIndexById.has(nb)) {
            compIndexById.set(nb, compCount);
            stack.push(nb);
          }
        }
      }
      compCount++;
    }

    const compMembers: { id: string; width: number; height: number }[][] = Array.from(
      { length: compCount },
      () => []
    );
    for (const m of realMembers) {
      const s = sizeForMember(m);
      compMembers[compIndexById.get(String(m.id))!].push({
        id: String(m.id),
        width: s.w,
        height: s.h,
      });
    }
    const compEdges: InducedEdge[][] = Array.from({ length: compCount }, () => []);
    for (const e of induced) {
      compEdges[compIndexById.get(e.from)!].push(e);
    }

    const placed = compMembers.map((ms, ci) =>
      placeComponent(
        ms,
        toAcyclicDedupedEdges(
          ms.map((m) => m.id),
          compEdges[ci]
        ),
        spacing * 2,
        relation
      )
    );

    const gap = Math.max(60, spacing * 6);
    const pack = shelfPack(placed, gap);

    for (const [ci, element] of placed.entries()) {
      const off = pack.offsets[ci];
      for (const b of element.boxes) {
        rel.set(b.id, { dx: off.x + b.cx - pack.width / 2, dy: off.y + b.cy - pack.height / 2 });
      }
    }

    // Label dummies: seed along the line between their semantic endpoints'
    // representatives, preferring the first sample whose rect stays clear of
    // sibling members (a dummy inside a foreign box strands its routing
    // ports — the box is an obstacle the port can never escape).
    const dummyClear = (cx: number, cy: number, d: Node): boolean => {
      const margin = 2 * spacing;
      const w = (d.width ?? 40) / 2 + margin;
      const h = (d.height ?? 20) / 2 + margin;
      for (const m of realMembers) {
        const r = rel.get(String(m.id));
        if (!r) {
          continue;
        }
        const s = sizeForMember(m);
        if (Math.abs(cx - r.dx) < w + s.w / 2 && Math.abs(cy - r.dy) < h + s.h / 2) {
          return false;
        }
      }
      return true;
    };
    for (const d of dummyMembers) {
      const id = String(d.id);
      const ep = dummyEndpoints.get(id);
      const mFrom = ep ? memberAtLevel(ep.from, levelId) : null;
      const mTo = ep ? memberAtLevel(ep.to, levelId) : null;
      const rFrom = mFrom ? rel.get(mFrom) : undefined;
      const rTo = mTo ? rel.get(mTo) : undefined;
      if (rFrom && rTo) {
        let best = { dx: (rFrom.dx + rTo.dx) / 2, dy: (rFrom.dy + rTo.dy) / 2 };
        for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.25, 0.75, 0.2, 0.8]) {
          const cx = rFrom.dx + (rTo.dx - rFrom.dx) * t;
          const cy = rFrom.dy + (rTo.dy - rFrom.dy) * t;
          if (dummyClear(cx, cy, d)) {
            best = { dx: cx, dy: cy };
            break;
          }
        }
        rel.set(id, best);
      } else if (rFrom || rTo) {
        const r = (rFrom ?? rTo)!;
        rel.set(id, { dx: r.dx, dy: r.dy });
      } else {
        rel.set(id, { dx: 0, dy: 0 });
      }
    }

    results.set(levelId, {
      contentWidth: pack.width,
      contentHeight: pack.height,
      relByMemberId: rel,
    });

    log.debug(ORTHO_DEBUG, 'COMPOUND_LEVEL_PLACED', {
      levelId,
      members: realMembers.length,
      dummies: dummyMembers.length,
      inducedEdges: induced.length,
      components: compCount,
    });
  }

  // Top-down composition: absolute centres from nested relative offsets.
  const rootResult = results.get(ROOT_LEVEL);
  if (!rootResult) {
    return false;
  }
  const queue: { levelId: string; centerX: number; centerY: number }[] = [
    { levelId: ROOT_LEVEL, centerX: 0, centerY: 0 },
  ];
  while (queue.length > 0) {
    const { levelId, centerX, centerY } = queue.shift()!;
    const level = results.get(levelId);
    if (!level) {
      continue;
    }
    for (const m of membersByLevel.get(levelId) ?? []) {
      const rel = level.relByMemberId.get(String(m.id));
      if (!rel) {
        continue;
      }
      const x = centerX + rel.dx;
      const y = centerY + rel.dy;
      m.x = x;
      m.y = y;
      if (m.isGroup) {
        const r = results.get(String(m.id));
        if (r) {
          m.width = r.contentWidth + 2 * GROUP_PAD;
          m.height = r.contentHeight + 2 * GROUP_PAD;
        }
        queue.push({ levelId: String(m.id), centerX: x, centerY: y });
      }
    }
  }
  return true;
}

/**
 * Dagre-based compound placement: flow-aware layered placement with
 * barycenter crossing reduction and native cluster support — everything the
 * per-level DOMUS SATs lack. Group-endpoint edges are proxied onto a leaf
 * descendant (same convention as `conversion.ts`). Positions land directly on
 * the candidate's leaves/dummies; `preprocessClusters` re-frames the groups.
 */
function applyDagreCompoundPlacement(candidate: LayoutData, _spacing: number): boolean {
  const nodesById = new Map<string, Node>();
  const childrenByParent = new Map<string, Node[]>();
  for (const n of candidate.nodes ?? []) {
    if (n?.id != null) {
      nodesById.set(String(n.id), n);
    }
  }
  inferEdgeLabelParentIds(nodesById, (candidate.edges ?? []) as never);
  for (const n of candidate.nodes ?? []) {
    const pid = n.parentId != null ? String(n.parentId) : null;
    if (pid && nodesById.get(pid)?.isGroup) {
      const arr = childrenByParent.get(pid) ?? [];
      arr.push(n);
      childrenByParent.set(pid, arr);
    }
  }

  const leafDescendant = (id: string, seen = new Set<string>()): string | null => {
    if (seen.has(id)) {
      return null;
    }
    seen.add(id);
    const node = nodesById.get(id);
    if (!node) {
      return null;
    }
    if (!node.isGroup) {
      return id;
    }
    for (const child of childrenByParent.get(id) ?? []) {
      const leaf = leafDescendant(String(child.id), seen);
      if (leaf) {
        return leaf;
      }
    }
    return null;
  };

  const dirValue = (candidate as { direction?: unknown }).direction;
  const rawDir = (typeof dirValue === 'string' ? dirValue : 'TB').trim().toUpperCase();
  const rankdir = rawDir === 'TD' || rawDir === 'DT' ? 'TB' : rawDir || 'TB';

  const g = new graphlib.Graph({ compound: true, multigraph: true });
  g.setGraph({
    rankdir,
    nodesep: 60,
    ranksep: 80,
    edgesep: 20,
    align: 'DL',
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of candidate.nodes ?? []) {
    const id = String(n.id);
    if (n.isGroup) {
      g.setNode(id, {});
    } else {
      g.setNode(id, { width: n.width ?? 40, height: n.height ?? 20 });
    }
  }
  for (const n of candidate.nodes ?? []) {
    const pid = n.parentId != null ? String(n.parentId) : null;
    if (pid && nodesById.get(pid)?.isGroup) {
      g.setParent(String(n.id), pid);
    }
  }
  for (const e of candidate.edges ?? []) {
    if (e?.id == null || e.start == null || e.end == null) {
      continue;
    }
    const s = leafDescendant(String(e.start));
    const t = leafDescendant(String(e.end));
    if (!s || !t || s === t) {
      continue;
    }
    g.setEdge(s, t, {}, String(e.id));
  }

  dagreLayout(g);

  let placedCount = 0;
  for (const n of candidate.nodes ?? []) {
    const p = g.node(String(n.id)) as { x?: number; y?: number } | undefined;
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
      n.x = p.x;
      n.y = p.y;
      placedCount++;
    }
  }
  log.debug(ORTHO_DEBUG, 'COMPOUND_DAGRE_PLACED', { placedCount, rankdir });
  return placedCount > 0;
}

/**
 * Score-gated compound placement candidate. `data` is the finalized main
 * geometry; `preFinalizeLayout` still carries the label dummy nodes routing
 * needs. Accepts the candidate when the unified validator strictly prefers
 * it; when both are invalid it accepts on a strict hard-issue decrease so the
 * downstream monotone remediation has a tractable starting point.
 */
export function tryCompoundGroupPlacementCandidateWhenScoreImproves(
  data: LayoutData,
  preFinalizeLayout: LayoutData,
  options: {
    spacing?: number;
    routeWithRoutingGraph: (candidate: LayoutData) => void;
  }
): void {
  const spacing = options.spacing ?? 10;

  const groupCount = (preFinalizeLayout.nodes ?? []).filter((n) => n?.isGroup).length;
  if (groupCount < 2) {
    return;
  }

  const baseline = validateLayout(data);
  if (baseline.ok && baseline.score >= 953) {
    return;
  }

  const candidate = cloneLayoutForCandidate(preFinalizeLayout);
  let placed = false;
  try {
    placed = applyDagreCompoundPlacement(candidate, spacing);
  } catch (err) {
    log.debug(ORTHO_DEBUG, 'COMPOUND_DAGRE_FAILED', { error: String(err) });
  }
  if (!placed && !applyCompoundPlacement(candidate, spacing)) {
    return;
  }

  preprocessClusters(candidate, { spacing, groupPadding: COMPOUND_GROUP_PAD });
  nudgeEdgeLabelNodesToAvoidOverlaps(candidate, { padding: 12, maxIterations: 25 });
  options.routeWithRoutingGraph(candidate);

  // Same post-routing repair chain the cycle-removal path applies after its
  // routing-graph pass; without it the candidate is compared unrepaired
  // against a fully repaired baseline.
  const postRoute = validateLayout(candidate);
  const portMismatchEdgeIds = new Set<string>(
    postRoute.issues
      .filter((iss) => iss.type === 'edge-port-direction-mismatch' && iss.edgeId)
      .map((iss) => String(iss.edgeId))
  );
  if (!postRoute.ok && portMismatchEdgeIds.size > 0) {
    applyPortDirectionStubs(candidate, portMismatchEdgeIds, Math.max(2, Math.min(20, spacing)));
  }
  // Post-routing nudges occasionally leave diagonal joints; the validator
  // treats any diagonal as hard-invalid. Insert a corner at each one — the
  // corner occupies the same corridor the diagonal already claimed, and the
  // obstacle-lift/detour repairs below clean up what it clips.
  for (const e of candidate.edges ?? []) {
    const pts = e.points;
    if (!Array.isArray(pts) || pts.length < 2) {
      continue;
    }
    let hasDiagonal = false;
    for (let i = 0; i < pts.length - 1; i++) {
      if (Math.abs(pts[i].x - pts[i + 1].x) > 1e-6 && Math.abs(pts[i].y - pts[i + 1].y) > 1e-6) {
        hasDiagonal = true;
        break;
      }
    }
    if (!hasDiagonal) {
      continue;
    }
    const ortho = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const prev = ortho[ortho.length - 1];
      const cur = pts[i];
      if (Math.abs(prev.x - cur.x) > 1e-6 && Math.abs(prev.y - cur.y) > 1e-6) {
        ortho.push({ x: prev.x, y: cur.y });
      }
      ortho.push(cur);
    }
    e.points = ortho;
  }
  applyStraightCollapsePass(candidate);
  liftObstacleIntersectingSegments(candidate, { spacing });
  applyObstacleDetourInsertPass(candidate, { spacing });
  snapEndpointsToBoundaries(candidate, { tolerance: 1.5 });
  repairShortEndpointStubs(candidate, { minLength: spacing });
  repairEndpointApproachesWhenIssuesImprove(candidate, { spacing });
  repairNonOrthogonalEdgesWhenIssuesImprove(candidate, { spacing });

  finalizeDummyLabelNodesToOverlayLabels(candidate);

  const candidateResult = validateLayout(candidate);
  const hardIssues = (r: ReturnType<typeof validateLayout>): number => r.issues.length;

  const accept =
    (candidateResult.ok && !baseline.ok) ||
    (candidateResult.ok && baseline.ok && candidateResult.score > baseline.score) ||
    (!candidateResult.ok && !baseline.ok && hardIssues(candidateResult) < hardIssues(baseline));

  const issueCounts = (issues: readonly { type: string }[]): Record<string, number> => {
    const m: Record<string, number> = {};
    for (const i of issues) {
      m[i.type] = (m[i.type] ?? 0) + 1;
    }
    return m;
  };
  log.debug(ORTHO_DEBUG, 'COMPOUND_PLACEMENT_CANDIDATE', {
    accept,
    baselineOk: baseline.ok,
    baselineScore: baseline.score,
    baselineIssues: baseline.issues.length,
    candidateOk: candidateResult.ok,
    candidateScore: candidateResult.score,
    candidateIssues: candidateResult.issues.length,
    candidateIssueTypes: issueCounts(candidateResult.issues),
    baselineIssueTypes: issueCounts(baseline.issues),
  });

  if (accept) {
    copyLayoutGeometry(data, candidate);
  }
}
