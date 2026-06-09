import type { LayoutData, Node, Edge } from '../../../types.js';
import type { Point, Rect, PortSide } from '../types.js';
import { rectForNode, approxEqual } from '../core/helpers.js';
import { axisCoordForSide, computeBoundaryPortAtT, sideOutDirUnit } from '../core/geometry.js';
import { inflateRect, findRoutingGraphPathBetweenPortsWithObstacles } from '../core/routing.js';
import { isEdgeLabelNodeId } from '../core/labels.js';
import { sanitizeOrthogonalPolylineForRendering } from './sanitize.js';

/**
 * iter-23 / R9 / Phase C3 — emit an orthogonal L-connection between a port's
 * `anchor` and the first/last point of the outer polyline, WITHOUT relying on
 * sanitize's final-pass diagonal break.
 *
 * Port reshuffle (`reconcilePortsToLaneOrderRoutingGraph`) moves a port to a
 * new t-sample on the side. The new anchor (= `port + out * stubDist`) may
 * land off-axis from `outer[0]` (start kind) or `outer[last]` (end kind),
 * producing a diagonal segment. The DOMUS/Kandinsky invariant
 * (Siebenhaller §2.3.2.1 — perpendicular entry through the port) requires
 * the segment incident on the anchor to travel along the port's outward
 * normal axis. When `anchor` and `adjacent` disagree on the perpendicular
 * axis, insert an elbow at the corner where the outward-normal axis meets
 * the adjacent point's perpendicular axis.
 *
 * Paper anchor: Siebenhaller §2.3.2.1 (source `0fb2d84f`) — Kandinsky
 * perpendicular-entry invariant. Mirrors `ensureAxisAlignedPortExit` from
 * iter-21 R15 (`domus/edgePaths.ts:520`) in spirit but lives here so the
 * fallback pipeline doesn't reach into DOMUS-native code.
 */
export function joinOrthogonallyAtPort(
  anchor: Point,
  outer: readonly Point[],
  side: PortSide,
  kind: 'start' | 'end'
): Point[] {
  if (outer.length === 0) {
    return [anchor];
  }
  const adjacent = kind === 'start' ? outer[0] : outer[outer.length - 1];
  const isHorizontalSide = side === 'E' || side === 'W';
  const axisEqual = isHorizontalSide
    ? approxEqual(anchor.y, adjacent.y)
    : approxEqual(anchor.x, adjacent.x);
  if (axisEqual) {
    return kind === 'start' ? [anchor, ...outer] : [...outer, anchor];
  }
  const elbow: Point = isHorizontalSide
    ? { x: adjacent.x, y: anchor.y }
    : { x: anchor.x, y: adjacent.y };
  return kind === 'start' ? [anchor, elbow, ...outer] : [...outer, elbow, anchor];
}

function determineSideOnRect(p: Point, r: Rect): PortSide | null {
  if (approxEqual(p.x, r.left)) {
    return 'W';
  }
  if (approxEqual(p.x, r.right)) {
    return 'E';
  }
  if (approxEqual(p.y, r.top)) {
    return 'N';
  }
  if (approxEqual(p.y, r.bottom)) {
    return 'S';
  }
  return null;
}

function sampleCoordOutsideHalo(
  points: Point[],
  endpoint: 'start' | 'end',
  haloDist: number,
  side: PortSide
): number {
  if (!points || points.length < 2) {
    return 0;
  }
  const d = Math.max(0, haloDist);
  // Walk from the endpoint along the polyline by Manhattan distance and pick the coordinate at distance d.
  let remaining = d;
  if (endpoint === 'start') {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const seg = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      if (seg <= 1e-9) {
        continue;
      }
      if (remaining <= seg) {
        // interpolate along orthogonal segment
        if (approxEqual(a.x, b.x)) {
          const dir = b.y > a.y ? 1 : -1;
          const p = { x: a.x, y: a.y + dir * remaining };
          return axisCoordForSide(p, side);
        }
        const dir = b.x > a.x ? 1 : -1;
        const p = { x: a.x + dir * remaining, y: a.y };
        return axisCoordForSide(p, side);
      }
      remaining -= seg;
    }
    return axisCoordForSide(points[points.length - 1], side);
  }
  for (let i = points.length - 1; i > 0; i--) {
    const a = points[i];
    const b = points[i - 1];
    const seg = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    if (seg <= 1e-9) {
      continue;
    }
    if (remaining <= seg) {
      if (approxEqual(a.x, b.x)) {
        const dir = b.y > a.y ? 1 : -1;
        const p = { x: a.x, y: a.y + dir * remaining };
        return axisCoordForSide(p, side);
      }
      const dir = b.x > a.x ? 1 : -1;
      const p = { x: a.x + dir * remaining, y: a.y };
      return axisCoordForSide(p, side);
    }
    remaining -= seg;
  }
  return axisCoordForSide(points[0], side);
}

function routeLShapeBetweenPorts(a: Point, b: Point): Point[] {
  if (approxEqual(a.x, b.x) || approxEqual(a.y, b.y)) {
    return [a, b];
  }
  // Deterministic: vertical-then-horizontal elbow.
  return [a, { x: a.x, y: b.y }, b];
}

export function reconcilePortsToLaneOrderRoutingGraph(
  data: LayoutData,
  nodesById: Map<string, Node>,
  spacing: number,
  clearance: number,
  options: {
    includeLabelEdges?: boolean;
    model?: 'grid' | 'representatives' | 'channels' | 'ocr';
  } = {}
): void {
  // For each node side, reorder ports to match the order of edges just outside a halo around the node.
  // This prevents forced swaps right outside the node that cause Z-bends/crossings.
  const stubDist = Math.max(0, clearance) + Math.max(0, spacing);
  // Sample beyond the handle so we see corridor lane order rather than just the port/anchor.
  const haloDist = stubDist * 2;
  const byNodeSide = new Map<
    string,
    {
      edge: Edge;
      edgeId: string;
      kind: 'start' | 'end';
      side: PortSide;
      sample: number;
      otherOrder: number;
    }[]
  >();
  const portByEdgeEndpoint = new Map<string, { port: Point; side: PortSide; anchor: Point }>(); // `${edgeId}|start|end`

  for (const e of data.edges ?? []) {
    if (e?.id == null || (e as any).start == null || (e as any).end == null) {
      continue;
    }
    if (!(e as any).points || (e as any).points.length < 2) {
      continue;
    }
    const edgeId = String((e as any).id);
    const sId = String((e as any).start);
    const tId = String((e as any).end);
    if (options.includeLabelEdges !== true && (isEdgeLabelNodeId(sId) || isEdgeLabelNodeId(tId))) {
      continue;
    }
    const sNode = nodesById.get(sId);
    const tNode = nodesById.get(tId);
    if (!sNode || !tNode) {
      continue;
    }

    const rs = rectForNode(sNode);
    const rt = rectForNode(tNode);
    const pts = (e as any).points as Point[];
    const sSide = determineSideOnRect(pts[0], rs);
    const tSide = determineSideOnRect(pts[pts.length - 1], rt);
    if (sSide) {
      const k = `${sId}:${sSide}`;
      const sample = sampleCoordOutsideHalo(pts, 'start', haloDist, sSide);
      const otherOrder = sSide === 'E' || sSide === 'W' ? rt.cy : rt.cx;
      (byNodeSide.get(k) ?? byNodeSide.set(k, []).get(k)!).push({
        edge: e as any,
        edgeId,
        kind: 'start',
        side: sSide,
        sample,
        otherOrder,
      });
    }
    if (tSide) {
      const k = `${tId}:${tSide}`;
      const sample = sampleCoordOutsideHalo(pts, 'end', haloDist, tSide);
      const otherOrder = tSide === 'E' || tSide === 'W' ? rs.cy : rs.cx;
      (byNodeSide.get(k) ?? byNodeSide.set(k, []).get(k)!).push({
        edge: e as any,
        edgeId,
        kind: 'end',
        side: tSide,
        sample,
        otherOrder,
      });
    }
  }

  for (const [key, eps] of byNodeSide.entries()) {
    if (eps.length <= 1) {
      continue;
    }
    const [nodeId, side] = key.split(':') as [string, PortSide];
    const node = nodesById.get(nodeId);
    if (!node) {
      continue;
    }
    const r = rectForNode(node);

    eps.sort(
      (a, b) =>
        a.sample - b.sample ||
        // Tie-break by target direction (other endpoint position) so port order
        // is driven by geometry rather than edge id.
        a.otherOrder - b.otherOrder ||
        a.edgeId.localeCompare(b.edgeId) ||
        a.kind.localeCompare(b.kind)
    );

    // Corner exclusion: keep ports in the middle half of the side.
    const lo = 0.25;
    const hi = 0.75;
    const n = eps.length;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : lo + (i * (hi - lo)) / (n - 1);
      const port = computeBoundaryPortAtT(r, side, t);
      const out = sideOutDirUnit(side);
      const anchor: Point = { x: port.x + out.x * stubDist, y: port.y + out.y * stubDist };

      const edge = eps[i].edge;
      const pts = (edge as any).points ?? [];
      if (pts.length < 2) {
        continue;
      }
      portByEdgeEndpoint.set(`${eps[i].edgeId}|${eps[i].kind}`, { port, side, anchor });

      if (eps[i].kind === 'start') {
        // iter-23 / R9 / Phase C3 — insert the anchor→tail[0] L-elbow
        // explicitly (Kandinsky perpendicular-entry, Siebenhaller §2.3.2.1)
        // instead of relying on sanitize's final-pass diagonal break. The
        // tail is assumed orthogonal from upstream routing; the only
        // potentially-diagonal segment is anchor→tail[0] after port
        // reshuffle moves the anchor off-axis.
        const tail = pts.slice(2);
        const joined = joinOrthogonallyAtPort(anchor, tail, side, 'start');
        (edge as any).points = sanitizeOrthogonalPolylineForRendering([port, ...joined], {
          spacing,
        });
      } else {
        const head = pts.slice(0, Math.max(0, pts.length - 2));
        const joined = joinOrthogonallyAtPort(anchor, head, side, 'end');
        (edge as any).points = sanitizeOrthogonalPolylineForRendering([...joined, port], {
          spacing,
        });
      }
    }
  }

  // For label-split edges, rebuild the full path using the *updated* ports/anchors.
  // This avoids the common failure mode where port reordering changes the endpoint geometry
  // enough that the old “core” path becomes invalid (border hugging / micro-kinks).
  const model = options.model ?? 'grid';
  const effModel: 'grid' | 'representatives' | 'channels' = model === 'ocr' ? 'channels' : model;
  if (options.includeLabelEdges === true) {
    const inflatedObstacles: Rect[] = [];
    for (const n of nodesById.values()) {
      inflatedObstacles.push(inflateRect(rectForNode(n), clearance));
    }

    for (const e of data.edges ?? []) {
      if (e?.id == null || (e as any).start == null || (e as any).end == null) {
        continue;
      }
      const edgeId = String((e as any).id);
      const sId = String((e as any).start);
      const tId = String((e as any).end);
      if (!(isEdgeLabelNodeId(sId) || isEdgeLabelNodeId(tId))) {
        continue;
      }

      const sNode = nodesById.get(sId);
      const tNode = nodesById.get(tId);
      if (!sNode || !tNode) {
        continue;
      }

      // Use reconciled ports when available; otherwise infer from current geometry.
      const sRect = rectForNode(sNode);
      const tRect = rectForNode(tNode);
      const curPts = ((e as any).points ?? []) as Point[];
      if (curPts.length < 2) {
        continue;
      }

      const sMeta =
        portByEdgeEndpoint.get(`${edgeId}|start`) ??
        (() => {
          const port = curPts[0];
          const side = determineSideOnRect(port, sRect) ?? 'E';
          const out = sideOutDirUnit(side);
          return {
            port,
            side,
            anchor: { x: port.x + out.x * stubDist, y: port.y + out.y * stubDist },
          };
        })();
      const tMeta =
        portByEdgeEndpoint.get(`${edgeId}|end`) ??
        (() => {
          const port = curPts[curPts.length - 1];
          const side = determineSideOnRect(port, tRect) ?? 'W';
          const out = sideOutDirUnit(side);
          return {
            port,
            side,
            anchor: { x: port.x + out.x * stubDist, y: port.y + out.y * stubDist },
          };
        })();

      const routed = findRoutingGraphPathBetweenPortsWithObstacles(
        sMeta.anchor,
        tMeta.anchor,
        inflatedObstacles,
        spacing,
        { model: effModel, clearance: 0 }
      );
      // If routing-graph fails to find a path (rare, but possible with tight obstacles),
      // fall back to a deterministic L-shape to keep the polyline orthogonal.
      const core = routed ?? routeLShapeBetweenPorts(sMeta.anchor, tMeta.anchor);
      (e as any).points = sanitizeOrthogonalPolylineForRendering(
        [sMeta.port, sMeta.anchor, ...core.slice(1, -1), tMeta.anchor, tMeta.port],
        { spacing }
      );
    }
  }
}
