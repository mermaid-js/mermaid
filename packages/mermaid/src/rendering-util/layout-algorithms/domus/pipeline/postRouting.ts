import type { LayoutData, Edge, Node } from '../../../types.js';
import type { Point } from '../types.js';
import { approxEqual, rectForNode } from '../core/helpers.js';
import {
  isStraightHorizontal,
  isStraightVertical,
  polylineIntersectsAnyRect,
} from '../core/routing.js';
import { longestPathCompaction } from '../compaction.js';

export function segmentKeyForSpacing(points: Point[]): string | null {
  if (!points || points.length < 2) {
    return null;
  }
  const isHoriz = isStraightHorizontal(points);
  const isVert = isStraightVertical(points);
  const isDetourHorizontal =
    points.length === 4 &&
    approxEqual(points[0].x, points[1].x) &&
    approxEqual(points[1].y, points[2].y) &&
    approxEqual(points[2].x, points[3].x);
  const isDetourVertical =
    points.length === 4 &&
    approxEqual(points[0].y, points[1].y) &&
    approxEqual(points[1].x, points[2].x) &&
    approxEqual(points[2].y, points[3].y);

  if (isHoriz) {
    const y = Math.round(points[0].y);
    const x1 = Math.round(Math.min(points[0].x, points[points.length - 1].x));
    const x2 = Math.round(Math.max(points[0].x, points[points.length - 1].x));
    return `H:${y}:${x1}:${x2}`;
  }
  if (isVert) {
    const x = Math.round(points[0].x);
    const y1 = Math.round(Math.min(points[0].y, points[points.length - 1].y));
    const y2 = Math.round(Math.max(points[0].y, points[points.length - 1].y));
    return `V:${x}:${y1}:${y2}`;
  }
  if (isDetourHorizontal) {
    const y = Math.round(points[1].y);
    // Stage-4 cut: treat detour corridors as bundles by their track level only.
    return `DH:${y}`;
  }
  if (isDetourVertical) {
    const x = Math.round(points[1].x);
    return `DV:${x}`;
  }

  return null;
}

export function applyPathOrderingAndSpacing(
  data: LayoutData,
  nodesById: Map<string, Node>,
  spacing: number
): void {
  if (spacing <= 0) {
    return;
  }

  interface GroupEdge {
    edge: Edge;
    startNodeId: string;
    endNodeId: string;
  }

  const groups = new Map<string, GroupEdge[]>();

  for (const edge of data.edges) {
    // Compound routes have semantic boundary waypoints (cluster entry/exit).
    // The current spacing/ordering stages are not waypoint-aware and can drop
    // intermediate points. Skip until we have a waypoint-preserving nudger.
    if ((edge as any).__orthoCompound) {
      continue;
    }
    if (!edge.start || !edge.end) {
      continue;
    }
    if (!edge.points || edge.points.length < 2) {
      continue;
    }
    const startNodeId = String(edge.start);
    const endNodeId = String(edge.end);
    const key = segmentKeyForSpacing(edge.points);
    if (!key) {
      continue;
    }
    let arr = groups.get(key);
    if (!arr) {
      arr = [];
      groups.set(key, arr);
    }
    arr.push({ edge, startNodeId, endNodeId });
  }

  for (const group of groups.values()) {
    if (group.length <= 1) {
      continue;
    }
    // Deterministic ordering inside the bundle.
    group.sort((a, b) => String(a.edge.id ?? '').localeCompare(String(b.edge.id ?? '')));
    const firstEdge = group[0].edge;
    const basePoints = firstEdge.points!;
    if (basePoints.length < 2) {
      continue;
    }

    function isDetourHorizontal(points: Point[]): boolean {
      // start -> vertical -> horizontal -> vertical -> end
      return (
        points.length === 4 &&
        approxEqual(points[0].x, points[1].x) &&
        approxEqual(points[1].y, points[2].y) &&
        approxEqual(points[2].x, points[3].x)
      );
    }

    function isDetourVertical(points: Point[]): boolean {
      // start -> horizontal -> vertical -> horizontal -> end
      return (
        points.length === 4 &&
        approxEqual(points[0].y, points[1].y) &&
        approxEqual(points[1].x, points[2].x) &&
        approxEqual(points[2].y, points[3].y)
      );
    }

    const isHoriz = isStraightHorizontal(basePoints);
    const isVert = isStraightVertical(basePoints);
    const isDetourH = isDetourHorizontal(basePoints);
    const isDetourV = isDetourVertical(basePoints);
    if (!isHoriz && !isVert && !isDetourH && !isDetourV) {
      continue;
    }

    // Ensure all edges in the group share the same simple shape.
    let compatible = true;
    const baseMidY = isDetourH ? basePoints[1].y : null;
    const baseMidX = isDetourV ? basePoints[1].x : null;
    for (const { edge } of group) {
      const pts = edge.points!;
      if (pts.length < 2) {
        compatible = false;
        break;
      }
      if (isHoriz && !isStraightHorizontal(pts)) {
        compatible = false;
        break;
      }
      if (isVert && !isStraightVertical(pts)) {
        compatible = false;
        break;
      }
      if (isDetourH && (!isDetourHorizontal(pts) || !approxEqual(pts[1].y, baseMidY!))) {
        compatible = false;
        break;
      }
      if (isDetourV && (!isDetourVertical(pts) || !approxEqual(pts[1].x, baseMidX!))) {
        compatible = false;
        break;
      }
    }
    if (!compatible) {
      continue;
    }

    const n = group.length;
    const centreIndex = (n - 1) / 2;

    for (let i = 0; i < n; i++) {
      const { edge, startNodeId, endNodeId } = group[i];
      const pts = edge.points!;
      const start = pts[0];
      const end = pts[pts.length - 1];
      const relIndex = i - centreIndex;
      const offset = relIndex * spacing;

      if (Math.abs(offset) < 1e-6) {
        if (isHoriz || isVert) {
          // Keep the central edge on the baseline as a straight segment.
          edge.points = [start, end];
        } else {
          // For detour shapes, keep the baseline detour (a straight segment would
          // typically collide with obstacles).
          edge.points = pts;
        }
        continue;
      }

      if (isHoriz) {
        const y = start.y + offset;
        const candidate: Point[] = [start, { x: start.x, y }, { x: end.x, y }, end];
        if (!polylineIntersectsAnyRect(candidate, nodesById, startNodeId, endNodeId)) {
          edge.points = candidate;
        }
      } else if (isVert) {
        const x = start.x + offset;
        const candidate: Point[] = [start, { x, y: start.y }, { x, y: end.y }, end];
        if (!polylineIntersectsAnyRect(candidate, nodesById, startNodeId, endNodeId)) {
          edge.points = candidate;
        }
      } else if (isDetourH) {
        const baseY = baseMidY!;
        const y = baseY + offset;
        const candidate: Point[] = [start, { x: start.x, y }, { x: end.x, y }, end];
        // In Stage 5 we will nudge tracks to satisfy δ_min with obstacles; so for
        // detour tracks we always apply the offset here and defer feasibility
        // repair to the nudger.
        edge.points = candidate;
      } else if (isDetourV) {
        const baseX = baseMidX!;
        const x = baseX + offset;
        const candidate: Point[] = [start, { x, y: start.y }, { x, y: end.y }, end];
        edge.points = candidate;
      }
    }
  }
}

export function applyPathOrderingAndSpacingLocal(
  data: LayoutData,
  nodesById: Map<string, Node>,
  spacing: number,
  edgeIds: Set<string>
): void {
  if (spacing <= 0 || edgeIds.size === 0) {
    return;
  }

  interface GroupEdge {
    edge: Edge;
    startNodeId: string;
    endNodeId: string;
  }
  const groups = new Map<string, GroupEdge[]>();

  for (const edge of data.edges) {
    const edgeId = edge?.id != null ? String(edge.id) : '';
    if (!edgeId || !edgeIds.has(edgeId)) {
      continue;
    }
    if ((edge as any).__orthoCompound) {
      continue;
    }
    if (!edge.start || !edge.end) {
      continue;
    }
    if (!edge.points || edge.points.length < 2) {
      continue;
    }
    const key = segmentKeyForSpacing(edge.points);
    if (!key) {
      continue;
    }
    let arr = groups.get(key);
    if (!arr) {
      arr = [];
      groups.set(key, arr);
    }
    arr.push({ edge, startNodeId: String(edge.start), endNodeId: String(edge.end) });
  }

  // Reuse global implementation on a temporary LayoutData with only the neighborhood edges.
  for (const group of groups.values()) {
    if (group.length <= 1) {
      continue;
    }
    group.sort((a, b) => String(a.edge.id ?? '').localeCompare(String(b.edge.id ?? '')));

    const basePoints = group[0].edge.points!;
    const isDetourH =
      basePoints.length === 4 &&
      approxEqual(basePoints[0].x, basePoints[1].x) &&
      approxEqual(basePoints[1].y, basePoints[2].y) &&
      approxEqual(basePoints[2].x, basePoints[3].x);
    const isDetourV =
      basePoints.length === 4 &&
      approxEqual(basePoints[0].y, basePoints[1].y) &&
      approxEqual(basePoints[1].x, basePoints[2].x) &&
      approxEqual(basePoints[2].y, basePoints[3].y);

    const isHoriz = isStraightHorizontal(basePoints);
    const isVert = isStraightVertical(basePoints);
    if (!isHoriz && !isVert && !isDetourH && !isDetourV) {
      continue;
    }

    const baseMidY = isDetourH ? basePoints[1].y : null;
    const baseMidX = isDetourV ? basePoints[1].x : null;

    // Ensure compatible shapes within group.
    let compatible = true;
    for (const { edge } of group) {
      const pts = edge.points!;
      if (isHoriz && !isStraightHorizontal(pts)) {
        compatible = false;
      }
      if (isVert && !isStraightVertical(pts)) {
        compatible = false;
      }
      if (
        isDetourH &&
        !(
          pts.length === 4 &&
          approxEqual(pts[0].x, pts[1].x) &&
          approxEqual(pts[1].y, pts[2].y) &&
          approxEqual(pts[2].x, pts[3].x) &&
          approxEqual(pts[1].y, baseMidY!)
        )
      ) {
        compatible = false;
      }
      if (
        isDetourV &&
        !(
          pts.length === 4 &&
          approxEqual(pts[0].y, pts[1].y) &&
          approxEqual(pts[1].x, pts[2].x) &&
          approxEqual(pts[2].y, pts[3].y) &&
          approxEqual(pts[1].x, baseMidX!)
        )
      ) {
        compatible = false;
      }
      if (!compatible) {
        break;
      }
    }
    if (!compatible) {
      continue;
    }

    const n = group.length;
    const centreIndex = (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      const { edge, startNodeId, endNodeId } = group[i];
      const pts = edge.points!;
      const start = pts[0];
      const end = pts[pts.length - 1];
      const relIndex = i - centreIndex;
      const offset = relIndex * spacing;
      if (Math.abs(offset) < 1e-6) {
        continue;
      }

      if (isHoriz) {
        const y = start.y + offset;
        const candidate: Point[] = [start, { x: start.x, y }, { x: end.x, y }, end];
        if (!polylineIntersectsAnyRect(candidate, nodesById, startNodeId, endNodeId)) {
          edge.points = candidate;
        }
      } else if (isVert) {
        const x = start.x + offset;
        const candidate: Point[] = [start, { x, y: start.y }, { x, y: end.y }, end];
        if (!polylineIntersectsAnyRect(candidate, nodesById, startNodeId, endNodeId)) {
          edge.points = candidate;
        }
      } else if (isDetourH) {
        const y = baseMidY! + offset;
        edge.points = [start, { x: start.x, y }, { x: end.x, y }, end];
      } else if (isDetourV) {
        const x = baseMidX! + offset;
        edge.points = [start, { x, y: start.y }, { x, y: end.y }, end];
      }
    }
  }
}

export function applyNudgingConstraintsLocal(
  data: LayoutData,
  nodesById: Map<string, Node>,
  spacing: number,
  edgeIds: Set<string>
): void {
  if (spacing <= 0 || edgeIds.size === 0) {
    return;
  }
  const saved = data.edges;
  // Temporarily treat only neighborhood edges as "the edges" for nudging; nodes remain full.
  data.edges = (data.edges ?? []).filter((e) => e?.id != null && edgeIds.has(String(e.id)));
  try {
    applyNudgingConstraints(data, nodesById, spacing);
  } finally {
    data.edges = saved;
  }
}

export function applyNudgingConstraints(
  data: LayoutData,
  nodesById: Map<string, Node>,
  spacing: number
): void {
  if (spacing <= 0) {
    return;
  }

  interface HSeg {
    edge: Edge;
    startId: string;
    endId: string;
    // indices of the segment endpoints in edge.points
    i1: number;
    i2: number;
    x1: number;
    x2: number;
    y: number;
  }

  const hsegs: HSeg[] = [];

  for (const edge of data.edges ?? []) {
    if ((edge as any).__orthoCompound) {
      continue;
    }
    if (!edge.start || !edge.end) {
      continue;
    }
    if (!edge.points || edge.points.length < 3) {
      continue;
    }

    // Collect internal horizontal segments only.
    // Important: avoid touching the first/last two points to keep port stubs/anchors stable
    // and prevent micro-doglegs from being introduced near terminals.
    const pts = edge.points;
    // For longer polylines that include explicit stubs/anchors near terminals,
    // avoid touching the first/last couple of segments. For short 4-point detours
    // the only "track" segment is points[1] -> points[2], and we *do* want to nudge it.
    const startIdx = pts.length >= 6 ? 2 : 1;
    const endExclusive = pts.length >= 6 ? pts.length - 3 : pts.length - 2;
    for (let i = startIdx; i < endExclusive; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (!approxEqual(a.y, b.y)) {
        continue;
      }
      const x1 = Math.min(a.x, b.x);
      const x2 = Math.max(a.x, b.x);
      hsegs.push({
        edge,
        startId: String(edge.start),
        endId: String(edge.end),
        i1: i,
        i2: i + 1,
        x1,
        x2,
        y: a.y,
      });
    }
  }

  if (hsegs.length === 0) {
    return;
  }

  function overlaps1D(a1: number, a2: number, b1: number, b2: number): boolean {
    return Math.max(a1, b1) < Math.min(a2, b2);
  }

  // 1) Push segments away from obstacles to satisfy δ_min (treated as spacing).
  for (const seg of hsegs) {
    for (const [nodeId, node] of nodesById) {
      if (nodeId === seg.startId || nodeId === seg.endId) {
        continue;
      }
      const r = rectForNode(node);
      if (!overlaps1D(seg.x1, seg.x2, r.left, r.right)) {
        continue;
      }
      // If y lies within the expanded band around the box, push away.
      const minY = r.top;
      const maxY = r.bottom;
      if (seg.y >= minY && seg.y <= maxY) {
        if (seg.y >= r.cy) {
          seg.y = r.bottom + spacing;
        } else {
          seg.y = r.top - spacing;
        }
      }
    }
  }

  // 2) Enforce spacing between overlapping horizontal tracks via a small
  // constraint-graph + longest-path compaction (deterministic).
  //
  // We build nodes for segments and arcs for:
  // - obstacle lower bounds (a virtual SOURCE -> seg)
  // - inter-track spacing for overlapping x-ranges (seg_i -> seg_j)
  hsegs.sort((a, b) => {
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    const ai = String(a.edge.id ?? '');
    const bi = String(b.edge.id ?? '');
    if (ai !== bi) {
      return ai.localeCompare(bi);
    }
    return a.i1 - b.i1;
  });

  const SOURCE = '__SRC__';
  const nodeIds = [SOURCE, ...hsegs.map((_s, i) => `seg:${i}`)];
  const arcs: { from: string; to: string; distance: number }[] = [];

  // Seed each segment with its current desired y.
  for (const [i, hseg] of hsegs.entries()) {
    const seg = hseg;
    arcs.push({ from: SOURCE, to: `seg:${i}`, distance: seg.y });
  }

  // Spacing constraints for overlapping segments, based on sorted order.
  for (let i = 1; i < hsegs.length; i++) {
    const prev = hsegs[i - 1];
    const cur = hsegs[i];
    if (!overlaps1D(prev.x1, prev.x2, cur.x1, cur.x2)) {
      continue;
    }
    arcs.push({ from: `seg:${i - 1}`, to: `seg:${i}`, distance: spacing });
  }

  const solved = longestPathCompaction(nodeIds, arcs, { objective: 'min', componentGap: 0 });
  for (const [i, hseg] of hsegs.entries()) {
    const y = solved.get(`seg:${i}`);
    if (y !== undefined) {
      hseg.y = y;
    }
  }

  // 3) Apply updated y back to edge points.
  for (const seg of hsegs) {
    const pts = seg.edge.points!;
    pts[seg.i1] = { x: pts[seg.i1].x, y: seg.y };
    pts[seg.i2] = { x: pts[seg.i2].x, y: seg.y };
  }
}
