import type { Point } from '../../rendering-elements/lineJump.js';
import type { CommonLayoutPaintContext } from '../common/index.js';
import type { LayoutData } from '../../types.js';

export interface PaintedEdge {
  id: string;
  d: string;
  hops: { other: string; x: number; y: number; radius: number }[];
}
export interface PaintedCrossing {
  a: string;
  b: string;
  point: Point;
}

/** Flatten the M/L/Q/circular-A geometry emitted by the ELK painter.
 * Straight runs remain exact; Q curves subdivide to at most 0.2 SVG unit flatness.
 * Each M starts a separate section, so gaps never become imaginary segments.
 */
export function flattenElkPath(d: string): Point[][] {
  const tokens = d.match(/[ALMQ]|[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[Ee][+-]?\d+)?/g) ?? [];
  // Do not interpret unsupported commands as coordinate lists.
  if (/[B-DF-KN-PR-Zb-df-kn-pr-z]/.test(d.replace(/[Ee][+-]?\d+/g, ''))) {
    return [];
  }
  let cursor = 0;
  let current: Point = { x: 0, y: 0 };
  let section: Point[] = [];
  const sections: Point[][] = [];
  const number = () => Number(tokens[cursor++]);
  const quadratic = (a: Point, c: Point, b: Point, depth = 0): void => {
    const deviation = Math.hypot(a.x - 2 * c.x + b.x, a.y - 2 * c.y + b.y) / 4;
    if (deviation <= 0.2 || depth >= 9) {
      section.push(b);
      return;
    }
    const ac = { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 };
    const cb = { x: (c.x + b.x) / 2, y: (c.y + b.y) / 2 };
    const mid = { x: (ac.x + cb.x) / 2, y: (ac.y + cb.y) / 2 };
    quadratic(a, ac, mid, depth + 1);
    quadratic(mid, cb, b, depth + 1);
  };
  while (cursor < tokens.length) {
    const command = tokens[cursor++];
    if (command === 'M' || command === 'L') {
      const point = { x: number(), y: number() };
      if (command === 'M') {
        section = [];
        sections.push(section);
      }
      section.push(point);
      current = point;
    } else if (command === 'Q') {
      const control = { x: number(), y: number() },
        end = { x: number(), y: number() };
      quadratic(current, control, end);
      current = end;
    } else if (command === 'A') {
      const rx = number(),
        ry = number(),
        rotation = number(),
        large = number(),
        sweep = number();
      const end = { x: number(), y: number() };
      if (
        Math.abs(rx - ry) > 0.01 ||
        rotation !== 0 ||
        large !== 0 ||
        Math.abs(Math.hypot(end.x - current.x, end.y - current.y) - 2 * rx) > 0.02
      ) {
        return [];
      }
      const center = { x: (current.x + end.x) / 2, y: (current.y + end.y) / 2 };
      const theta = Math.atan2(current.y - center.y, current.x - center.x);
      const steps = Math.max(8, Math.ceil((Math.PI * rx) / 1.5));
      for (let i = 1; i <= steps; i++) {
        const angle = theta + ((sweep ? 1 : -1) * Math.PI * i) / steps;
        section.push(
          i === steps
            ? end
            : { x: center.x + rx * Math.cos(angle), y: center.y + rx * Math.sin(angle) }
        );
      }
      current = end;
    } else {
      return [];
    }
  }
  return sections.filter(
    (points) =>
      points.length > 1 && points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  );
}

export function findUnbridgedPaintedCrossings(edges: PaintedEdge[]): PaintedCrossing[] {
  const cellSize = 128;
  interface Segment {
    edge: number;
    a: Point;
    b: Point;
    start: Point;
    end: Point;
  }
  const grid = new Map<string, Segment[]>();
  const pairs = new Map<string, { a: number; b: number; points: Point[] }>();
  for (let edge = 0; edge < edges.length; edge++) {
    for (const section of flattenElkPath(edges[edge].d)) {
      for (let k = 1; k < section.length; k++) {
        const segment: Segment = {
          edge,
          a: section[k - 1],
          b: section[k],
          start: section[0],
          end: section[section.length - 1],
        };
        const { a: p, b: q } = segment,
          dx = q.x - p.x,
          dy = q.y - p.y;
        if (Math.hypot(dx, dy) < 1e-8) {
          continue;
        }
        // Traverse crossed grid cells, not the potentially huge diagonal bounding box.
        let x = Math.floor(p.x / cellSize),
          y = Math.floor(p.y / cellSize);
        const endX = Math.floor(q.x / cellSize),
          endY = Math.floor(q.y / cellSize),
          sx = Math.sign(dx),
          sy = Math.sign(dy);
        let tx = dx ? ((sx > 0 ? x + 1 : x) * cellSize - p.x) / dx : Infinity;
        let ty = dy ? ((sy > 0 ? y + 1 : y) * cellSize - p.y) / dy : Infinity;
        const stepX = dx ? cellSize / Math.abs(dx) : Infinity,
          stepY = dy ? cellSize / Math.abs(dy) : Infinity;
        const cells = new Set<string>();
        const limit = Math.abs(endX - x) + Math.abs(endY - y) + 3;
        for (let step = 0; step < limit; step++) {
          // Neighbour cells also cover exact grid-boundary/corner contacts.
          for (let ox = -1; ox <= 1; ox++) {
            for (let oy = -1; oy <= 1; oy++) {
              cells.add(`${x + ox},${y + oy}`);
            }
          }
          if (x === endX && y === endY) {
            break;
          }
          if (tx < ty) {
            x += sx;
            tx += stepX;
          } else if (ty < tx) {
            y += sy;
            ty += stepY;
          } else {
            x += sx;
            y += sy;
            tx += stepX;
            ty += stepY;
          }
        }
        const candidates = new Set<Segment>();
        for (const key of cells) {
          for (const other of grid.get(key) ?? []) {
            if (other.edge !== edge) {
              candidates.add(other);
            }
          }
        }
        for (const other of candidates) {
          const { a: r, b: s } = other;
          if (
            Math.max(p.x, q.x) < Math.min(r.x, s.x) ||
            Math.max(r.x, s.x) < Math.min(p.x, q.x) ||
            Math.max(p.y, q.y) < Math.min(r.y, s.y) ||
            Math.max(r.y, s.y) < Math.min(p.y, q.y)
          ) {
            continue;
          }
          const ex = s.x - r.x,
            ey = s.y - r.y,
            denominator = dx * ey - dy * ex;
          if (Math.abs(denominator) < 1e-7) {
            continue;
          }
          const t = ((r.x - p.x) * ey - (r.y - p.y) * ex) / denominator,
            u = ((r.x - p.x) * dy - (r.y - p.y) * dx) / denominator;
          if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) {
            continue;
          }
          const point = { x: p.x + t * dx, y: p.y + t * dy };
          if (
            [segment.start, segment.end, other.start, other.end].some(
              (e) => Math.hypot(e.x - point.x, e.y - point.y) < 6
            )
          ) {
            continue;
          }
          const a = edges[other.edge],
            b = edges[edge];
          if (
            a.hops.some(
              (h) => h.other === b.id && Math.hypot(h.x - point.x, h.y - point.y) <= h.radius + 1
            ) ||
            b.hops.some(
              (h) => h.other === a.id && Math.hypot(h.x - point.x, h.y - point.y) <= h.radius + 1
            )
          ) {
            continue;
          }
          const key = `${other.edge}/${edge}`,
            pair = pairs.get(key) ?? { a: other.edge, b: edge, points: [] };
          if (!pair.points.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < 1)) {
            pair.points.push(point);
          }
          pairs.set(key, pair);
        }
        for (const key of cells) {
          const bucket = grid.get(key) ?? [];
          bucket.push(segment);
          grid.set(key, bucket);
        }
      }
    }
  }
  return [...pairs.values()]
    .sort((a, b) => a.a - b.a || a.b - b.b)
    .flatMap((pair) =>
      pair.points.map((point) => ({ a: edges[pair.a].id, b: edges[pair.b].id, point }))
    );
}

/** Arc preferred; a true transparent gap is the safe default if neither side
 * can carry an arc, including crossings on rounded Q curves. Masks affect only
 * the edge, never a label, background or marker definition. No white overlays.
 */
export function resolveElkCrossingFallbacks(
  data: LayoutData,
  context: CommonLayoutPaintContext
): void {
  if (data.config.elk?.lineHops === false) {
    return;
  }
  const group = context.measure.groups.edgePaths.node();
  const svg = group?.ownerSVGElement;
  if (!group || !svg) {
    return;
  }
  const paths = new Map<string, SVGPathElement>();
  const edges: PaintedEdge[] = [];
  for (const path of group.querySelectorAll<SVGPathElement>('path[data-id]')) {
    const id = path.getAttribute('data-id')!;
    paths.set(id, path);
    let hops: PaintedEdge['hops'] = [];
    try {
      hops = JSON.parse(path.getAttribute('data-line-hop-crossings') ?? '[]');
    } catch {
      /* Unannotated edges have no hops. */
    }
    edges.push({ id, d: path.getAttribute('d') ?? '', hops });
  }
  const crossings = findUnbridgedPaintedCrossings(edges);
  const byEdge = new Map<string, Point[]>();
  const endpointCache = new Map<string, Point[]>();
  const canGap = (id: string, point: Point) => {
    const path = paths.get(id)!;
    if (path.hasAttribute('mask')) {
      return false;
    }
    let endpoints = endpointCache.get(id);
    if (!endpoints) {
      const parts = flattenElkPath(path.getAttribute('d') || '');
      endpoints = [parts[0]?.[0], parts.at(-1)?.at(-1)].filter((p): p is Point => !!p);
      endpointCache.set(id, endpoints);
    }
    return (['start', 'end'] as const).every((side, i) => {
      const reserve = Number(path.getAttribute('data-elk-terminal-clearance-' + side) || 0),
        p = endpoints[i];
      return !reserve || !p || Math.hypot(point.x - p.x, point.y - p.y) >= reserve + 4;
    });
  };
  for (const crossing of crossings) {
    // A transparent gap must not erase the protected arrow lead-in either.
    const carrier = [crossing.b, crossing.a].find((id) => canGap(id, crossing.point));
    if (!carrier) {
      continue;
    } // Leave an impossible crossing observable for auditing.
    const points = byEdge.get(carrier) ?? [];
    if (
      !points.some(
        (point) => Math.hypot(point.x - crossing.point.x, point.y - crossing.point.y) < 1
      )
    ) {
      points.push(crossing.point);
    }
    byEdge.set(carrier, points);
  }
  const namespace = 'http://www.w3.org/2000/svg';
  let ordinal = 0;
  for (const [id, points] of byEdge) {
    const path = paths.get(id)!;
    if (path.hasAttribute('mask')) {
      continue;
    } // Never overwrite an author-owned mask.
    let maskId: string;
    do {
      maskId = `elk-crossing-gap-${svg.id}-${ordinal++}`;
    } while (svg.ownerDocument.getElementById(maskId));
    const mask = svg.ownerDocument.createElementNS(namespace, 'mask');
    mask.id = maskId;
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('maskContentUnits', 'userSpaceOnUse');
    mask.setAttribute('mask-type', 'luminance');
    const samples = flattenElkPath(path.getAttribute('d') ?? '').flat();
    const xs = samples.map((point) => point.x),
      ys = samples.map((point) => point.y);
    const x = Math.min(...xs) - 24,
      y = Math.min(...ys) - 24;
    const width = Math.max(...xs) - x + 24,
      height = Math.max(...ys) - y + 24;
    for (const [key, value] of Object.entries({ x, y, width, height })) {
      mask.setAttribute(key, String(value));
    }
    const background = svg.ownerDocument.createElementNS(namespace, 'rect');
    for (const [key, value] of Object.entries({ x, y, width, height, fill: 'white' })) {
      background.setAttribute(key, String(value));
    }
    background.style.fill = 'white';
    mask.appendChild(background);
    for (const point of points) {
      const circle = svg.ownerDocument.createElementNS(namespace, 'circle');
      circle.setAttribute('cx', String(point.x));
      circle.setAttribute('cy', String(point.y));
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', 'black');
      circle.style.fill = 'black';
      mask.appendChild(circle);
    }
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = svg.ownerDocument.createElementNS(namespace, 'defs');
      svg.prepend(defs);
    }
    defs.appendChild(mask);
    path.setAttribute('mask', `url(#${maskId})`);
    path.setAttribute('data-elk-crossing-gaps', JSON.stringify(points));
  }
}
