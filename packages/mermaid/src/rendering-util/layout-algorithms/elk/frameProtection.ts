import {
  findEdgeIntersections,
  replaceEdgePath,
  type Point,
} from '../../rendering-elements/lineJump.js';
import { generateRoundedPath, applyMarkerOffsetsToPoints } from '../../rendering-elements/edges.js';
import {
  readTerminalRunway,
  ensureStartMarkerSegmentLength,
  ensureEndMarkerSegmentLength,
} from './terminalRunway.js';
import { reduceRouteBends } from './bendReduction.js';
import { segmentHitsTitle, type TitleBox } from './titleProtection.js';
import type { LayoutData } from '../../types.js';
import type { CommonLayoutPaintContext } from '../common/index.js';

export interface FrameOverlap {
  segment: number;
  frame: TitleBox;
  axis: 'x' | 'y';
  boundary: number;
  length: number;
}

/** A perpendicular boundary crossing is legal; a sustained parallel run is not. */
export function findFrameOverlaps(points: Point[], frames: TitleBox[]): FrameOverlap[] {
  const out: FrameOverlap[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      dx = b.x - a.x,
      dy = b.y - a.y;
    for (const frame of frames) {
      for (const axis of ['x', 'y'] as const) {
        const vertical = axis === 'x',
          minor = vertical ? dx : dy,
          major = vertical ? dy : dx;
        if (Math.abs(major) < 1e-8 || Math.abs(minor) > Math.abs(major) * 0.12) {
          continue;
        }
        for (const boundary of vertical ? [frame.left, frame.right] : [frame.top, frame.bottom]) {
          let lo = 0,
            hi = 1;
          for (const [origin, delta, min, max] of vertical
            ? [
                [a.x, dx, boundary - 3, boundary + 3],
                [a.y, dy, frame.top, frame.bottom],
              ]
            : [
                [a.y, dy, boundary - 3, boundary + 3],
                [a.x, dx, frame.left, frame.right],
              ]) {
            if (Math.abs(delta) < 1e-8) {
              if (origin <= min || origin >= max) {
                hi = -1;
                break;
              }
            } else {
              const t1 = (min - origin) / delta,
                t2 = (max - origin) / delta;
              lo = Math.max(lo, Math.min(t1, t2));
              hi = Math.min(hi, Math.max(t1, t2));
            }
          }
          const length = Math.max(0, hi - lo) * Math.abs(major);
          if (length > 8) {
            out.push({ segment: i - 1, frame, axis, boundary, length });
          }
        }
      }
    }
  }
  return out;
}

function compact(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    if (out.length && Math.hypot(p.x - out[out.length - 1].x, p.y - out[out.length - 1].y) < 1e-5) {
      continue;
    }
    while (out.length > 1) {
      const a = out[out.length - 2],
        b = out[out.length - 1];
      if (
        Math.abs((b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x)) > 1e-5 ||
        (b.x - a.x) * (p.x - b.x) + (b.y - a.y) * (p.y - b.y) < 0
      ) {
        break;
      }
      out.pop();
    }
    out.push({ ...p });
  }
  return out;
}

/** Move the offending parallel run, not the frame. No masks/white overlays. */
export function routeAwayFromFrames(
  input: Point[],
  frames: TitleBox[],
  obstacles: TitleBox[],
  others: Point[][] = []
): Point[] {
  if (!findFrameOverlaps(input, frames).length) {
    return input.map((p) => ({ ...p }));
  }
  let points = input.map((p) => ({ ...p }));
  const attempted = new Set<string>();
  for (let iteration = 0; iteration < 32; iteration++) {
    const hit = findFrameOverlaps(points, frames).find(
      (h) =>
        !attempted.has(
          `${h.axis}/${h.boundary}/${JSON.stringify(points.slice(h.segment, h.segment + 2))}`
        )
    );
    if (!hit) {
      break;
    }
    const i = hit.segment,
      a = points[i],
      b = points[i + 1],
      vertical = hit.axis === 'x';
    // Restrict the repair to a narrow envelope around THIS frame side.
    // Retain remote route portions verbatim, even if a conservative bbox
    // elsewhere contains a valid existing shape-corner corridor.
    let enter = 0,
      exit = 1;
    const envelope = vertical
      ? {
          left: hit.boundary - 12,
          right: hit.boundary + 12,
          top: hit.frame.top - 12,
          bottom: hit.frame.bottom + 12,
        }
      : {
          left: hit.frame.left - 12,
          right: hit.frame.right + 12,
          top: hit.boundary - 12,
          bottom: hit.boundary + 12,
        };
    for (const [origin, delta, min, max] of [
      [a.x, b.x - a.x, envelope.left, envelope.right],
      [a.y, b.y - a.y, envelope.top, envelope.bottom],
    ]) {
      if (Math.abs(delta) < 1e-8) {
        continue;
      }
      const t1 = (min - origin) / delta,
        t2 = (max - origin) / delta;
      enter = Math.max(enter, Math.min(t1, t2));
      exit = Math.min(exit, Math.max(t1, t2));
    }
    const cuts = [enter, exit].filter((t) => t > 1e-6 && t < 1 - 1e-6);
    if (cuts.length) {
      points.splice(
        i + 1,
        0,
        ...cuts.map((t) => ({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }))
      );
      continue;
    }
    const u = vertical ? a.y : a.x,
      v = vertical ? b.y : b.x;
    const min = vertical ? hit.frame.top : hit.frame.left,
      max = vertical ? hit.frame.bottom : hit.frame.right;
    const clamp = (n: number) => Math.max(Math.min(u, v), Math.min(Math.max(u, v), n));
    const near = clamp(u < v ? min - 10 : max + 10),
      far = clamp(u < v ? max + 10 : min - 10);
    const candidates: Point[][] = [];
    for (const shift of [-10, 10, -18, 18, -30, 30, -50, 50]) {
      const lane = hit.boundary + shift;
      if (vertical) {
        candidates.push(
          [
            a,
            { x: a.x, y: near },
            { x: lane, y: near },
            { x: lane, y: far },
            { x: b.x, y: far },
            b,
          ],
          [a, { x: lane, y: a.y }, { x: lane, y: b.y }, b]
        );
      } else {
        candidates.push(
          [
            a,
            { x: near, y: a.y },
            { x: near, y: lane },
            { x: far, y: lane },
            { x: far, y: b.y },
            b,
          ],
          [a, { x: a.x, y: lane }, { x: b.x, y: lane }, b]
        );
      }
    }
    const valid = candidates
      .map(compact)
      .filter(
        (route) =>
          !findFrameOverlaps(route, frames).length &&
          !route.some(
            (p, j) => j && obstacles.some((box) => segmentHitsTitle(route[j - 1], p, box))
          )
      );
    const cost = (route: Point[]) =>
      route.reduce(
        (n, p, j) => (j ? n + Math.hypot(p.x - route[j - 1].x, p.y - route[j - 1].y) : n),
        0
      ) +
      route.length * 8 +
      10000 *
        others.reduce(
          (n, other) =>
            n +
            findEdgeIntersections([
              { id: 'candidate', points: route },
              { id: 'other', points: other },
            ]).length,
          0
        );
    const ranked = valid
      .map((route) => ({ route, cost: cost(route) }))
      .sort((a, b) => a.cost - b.cost);
    if (!ranked.length) {
      attempted.add(`${hit.axis}/${hit.boundary}/${JSON.stringify(points.slice(i, i + 2))}`);
      continue;
    }
    points = compact([...points.slice(0, i), ...ranked[0].route, ...points.slice(i + 2)]);
  }
  return compact(points);
}

function paintedBox(element: Element, inverse: DOMMatrix): TitleBox {
  const r = element.getBoundingClientRect(),
    a = new DOMPoint(r.left, r.top).matrixTransform(inverse),
    b = new DOMPoint(r.right, r.bottom).matrixTransform(inverse);
  return { left: a.x, right: b.x, top: a.y, bottom: b.y };
}

export function protectElkFrames(data: LayoutData, context: CommonLayoutPaintContext): void {
  const group = context.measure.groups.edgePaths.node(),
    svg = group?.ownerSVGElement,
    matrix = group?.getScreenCTM?.();
  if (!group || !svg || !matrix || typeof DOMPoint === 'undefined') {
    return;
  }
  const inverse = matrix.inverse();
  const frames = [...svg.querySelectorAll('g.cluster > rect,g.node > rect')].map((frame) =>
    paintedBox(frame, inverse)
  );
  const obstacles = [...svg.querySelectorAll('g.node,g.cluster-label')].map((element) =>
    paintedBox(element, inverse)
  );
  const textObstacles = [...svg.querySelectorAll('g.node .label')].map((element) =>
    paintedBox(element, inverse)
  );
  const labelAnchors = new Map(
    [...svg.querySelectorAll('g.edgeLabel > g.label[data-id]')].map((label) => {
      const box = paintedBox(label, inverse);
      return [
        label.getAttribute('data-id')!,
        { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 },
      ] as const;
    })
  );
  const edges = new Map(data.edges.map((edge) => [edge.id, edge]));
  const records = [...group.querySelectorAll<SVGPathElement>('path[data-id][data-points]')].flatMap(
    (path) => {
      try {
        return [{ path, points: JSON.parse(atob(path.getAttribute('data-points')!)) as Point[] }];
      } catch {
        return [];
      }
    }
  );
  const ownerBounds = new Map(
    [...context.measure.nodeElements].map(([id, node]) => [
      id,
      node.node() ? paintedBox(node.node()!, inverse) : undefined,
    ])
  );
  const terminalPolicies = new Map(
    records.map((record) => {
      const edge = edges.get(record.path.getAttribute('data-id')!);
      const policy = readTerminalRunway(record.path, edge || {});
      policy.rounded = true;
      policy.startBounds = edge?.start ? ownerBounds.get(edge.start) : undefined;
      policy.endBounds = edge?.end ? ownerBounds.get(edge.end) : undefined;
      for (const side of ['start', 'end'] as const) {
        const marker = policy[side],
          reserve = marker ? marker.back + marker.lead : 0;
        record.path.setAttribute('data-elk-terminal-clearance-' + side, String(reserve));
        if (edge) {
          (edge as unknown as Record<string, unknown>)[
            side === 'start' ? 'terminalClearanceStart' : 'terminalClearanceEnd'
          ] = reserve;
        }
      }
      return [record, policy] as const;
    })
  );
  // First establish the same feasible incumbent as V3, then optimize against
  // the FINAL routes of all peers. Never compare a proposal to stale peer paths.
  for (const optimize of [false, true]) {
    for (const record of records) {
      const edge = edges.get(record.path.getAttribute('data-id')!);
      if (!edge || (edge.curve && !['rounded', 'linear'].includes(edge.curve))) {
        continue;
      }
      const others = records.filter((other) => other !== record).map((other) => other.points);
      const endpoints = [record.points[0], record.points.at(-1)!];
      const contains = (box: TitleBox, p: Point) =>
        p.x >= box.left - 1 && p.x <= box.right + 1 && p.y >= box.top - 1 && p.y <= box.bottom + 1;
      // Source/target non-rectangular ports can sit inside their conservative body
      // bbox. Preserve their headings and keep their actual text protected instead.
      const routingObstacles = [
        ...obstacles.filter((box) => !endpoints.some((p) => contains(box, p))),
        ...textObstacles,
      ].map((box) => ({
        left: box.left - 2,
        right: box.right + 2,
        top: box.top - 2,
        bottom: box.bottom + 2,
      }));
      const anchor = labelAnchors.get(edge.id);
      const anchors = anchor ? [anchor] : [];
      let routed = optimize
        ? reduceRouteBends(
            record.points,
            frames,
            routingObstacles,
            others,
            anchors,
            terminalPolicies.get(record)
          )
        : routeAwayFromFrames(record.points, frames, obstacles, others);
      const policy = terminalPolicies.get(record);
      if (policy?.endBounds && (policy.end?.back || policy.end?.offset)) {
        routed = ensureEndMarkerSegmentLength(
          routed,
          policy.endBounds,
          policy.end.offset || policy.end.back
        );
      }
      if (policy?.startBounds && (policy.start?.back || policy.start?.offset)) {
        routed = ensureStartMarkerSegmentLength(
          routed,
          policy.startBounds,
          policy.start.offset || policy.start.back
        );
      }
      if (JSON.stringify(routed) === JSON.stringify(record.points)) {
        continue;
      }
      record.points = routed;
      edge.points = routed;
      edge.curve = 'rounded';
      record.path.setAttribute('data-points', btoa(JSON.stringify(routed)));
      replaceEdgePath(
        record.path,
        generateRoundedPath(applyMarkerOffsetsToPoints(routed, edge), 5)
      );
      record.path.setAttribute(
        optimize ? 'data-elk-bend-reduced' : 'data-elk-frame-detour',
        'true'
      );
    }
  }
}
