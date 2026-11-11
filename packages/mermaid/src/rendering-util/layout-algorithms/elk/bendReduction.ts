import { findEdgeIntersections, type Point } from '../../rendering-elements/lineJump.js';
import { findFrameOverlaps } from './frameOverlap.js';
import { terminalDeficit, minimumRawLead, type TerminalRunway } from './terminalRunway.js';
import { segmentHitsTitle, type TitleBox } from './titleProtection.js';

const EPS = 1e-5;
export function compactRoute(input: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of input) {
    if (out.length && Math.hypot(p.x - out[out.length - 1].x, p.y - out[out.length - 1].y) < EPS) {
      continue;
    }
    while (out.length > 1) {
      const a = out[out.length - 2],
        b = out[out.length - 1];
      if (
        Math.abs((b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x)) > EPS ||
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
export function routeBends(points: Point[]): number {
  return Math.max(0, compactRoute(points).length - 2);
}
export function routeLength(points: Point[]): number {
  return points.reduce(
    (n, p, i) => n + (i ? Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) : 0),
    0
  );
}
function heading(a: Point, b: Point): string {
  if (Math.abs(a.x - b.x) < EPS) {
    return b.y > a.y ? 'D' : 'U';
  }
  if (Math.abs(a.y - b.y) < EPS) {
    return b.x > a.x ? 'R' : 'L';
  }
  return 'diagonal';
}
/** Obstacle-free minimum for fixed signed orthogonal port headings. */
export function portBendLowerBound(points: Point[]): number {
  const p = compactRoute(points);
  if (p.length < 3) {
    return 0;
  }
  const a = p[0],
    b = p.at(-1)!,
    first = heading(a, p[1]),
    last = heading(p.at(-2)!, b);
  const vertical = (d: string) => d === 'U' || d === 'D';
  if (first === 'diagonal' || last === 'diagonal') {
    return 0;
  }
  const along = (d: string) =>
    d === 'R' ? b.x - a.x : d === 'L' ? a.x - b.x : d === 'D' ? b.y - a.y : a.y - b.y;
  if (vertical(first) !== vertical(last)) {
    return along(first) > EPS && along(last) > EPS ? 1 : 3;
  }
  const transverse = vertical(first) ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y);
  if (first !== last) {
    return transverse > EPS ? 2 : 4;
  }
  if (along(first) > EPS) {
    return transverse > EPS ? 2 : 0;
  }
  return 4;
}

export function distanceToRoute(point: Point, route: Point[]): number {
  let distance = Infinity;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1],
      b = route[i],
      dx = b.x - a.x,
      dy = b.y - a.y;
    const t = Math.max(
      0,
      Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1))
    );
    distance = Math.min(distance, Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy));
  }
  return distance;
}

function crossings(route: Point[], others: Point[][]): number {
  return others.reduce(
    (n, points) =>
      n +
      findEdgeIntersections([
        { id: 'route', points: route, curve: 'rounded' },
        { id: 'other', points, curve: 'rounded' },
      ]).length,
    0
  );
}

/** Whole-route shortcut/lane search, not a sequence of local frame notches.
 * Hard gates: same ports/headings, no new body/text intersection, no frame run,
 * and no additional point crossings. Only then compare bends and length.
 * This is an explicitly bounded search, NOT a global optimality certificate.
 */
export function reduceRouteBends(
  input: Point[],
  frames: TitleBox[],
  obstacles: TitleBox[],
  others: Point[][] = [],
  labelAnchors: Point[] = [],
  terminalPolicy: TerminalRunway = {}
): Point[] {
  let points = compactRoute(input);
  // Collinear waypoints are not junctions: normalize BOTH sides before counting.
  others = others.map(compactRoute);
  if (points.length < 3 || points.some((p, i) => i && heading(points[i - 1], p) === 'diagonal')) {
    return input.map((p) => ({ ...p }));
  }
  const lowerBound = portBendLowerBound(points);
  if (
    !findFrameOverlaps(points, frames).length &&
    terminalDeficit(points, terminalPolicy) < 0.01 &&
    points.length - 2 <= lowerBound
  ) {
    return points;
  }
  const first = heading(points[0], points[1]),
    last = heading(points[points.length - 2], points[points.length - 1]);
  const ceiling = crossings(points, others);
  const selfCeiling = crossings(points, [points]);
  const anchorLimits = labelAnchors.map((point) => ({
    point,
    distance: Math.max(2, distanceToRoute(point, input)),
  }));
  const portStubs = () => {
    const a = points[0],
      b = points.at(-1)!,
      u = points[1],
      v = points.at(-2)!;
    const startLength = Math.hypot(u.x - a.x, u.y - a.y),
      endLength = Math.hypot(b.x - v.x, b.y - v.y);
    const startLead = Math.max(8, minimumRawLead(terminalPolicy.start)),
      endLead = Math.max(8, minimumRawLead(terminalPolicy.end));
    return {
      s: {
        x: a.x + ((u.x - a.x) * startLead) / startLength,
        y: a.y + ((u.y - a.y) * startLead) / startLength,
      },
      t: {
        x: b.x - ((b.x - v.x) * endLead) / endLength,
        y: b.y - ((b.y - v.y) * endLead) / endLength,
      },
    };
  };
  const lane = (axis: 'x' | 'y') => {
    const values = new Set(points.map((p) => p[axis]));
    values.add((points[0][axis] + points.at(-1)![axis]) / 2);
    // Prefer existing lanes; add only sides of frames close to the route envelope.
    const xs = points.map((p) => p.x),
      ys = points.map((p) => p.y);
    const near = frames.filter(
      (f) =>
        f.left <= Math.max(...xs) + 30 &&
        f.right >= Math.min(...xs) - 30 &&
        f.top <= Math.max(...ys) + 30 &&
        f.bottom >= Math.min(...ys) - 30
    );
    for (const f of near) {
      for (const n of axis === 'x' ? [f.left - 10, f.right + 10] : [f.top - 10, f.bottom + 10]) {
        values.add(n);
      }
    }
    const mid = (points[0][axis] + points[points.length - 1][axis]) / 2;
    const { s, t } = portStubs();
    return [
      ...new Set([
        ...[...values].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b).slice(0, 24),
        s[axis],
        t[axis],
      ]),
    ];
  };
  for (let pass = 0; pass < 3; pass++) {
    const initialSafe =
      !findFrameOverlaps(points, frames).length && terminalDeficit(points, terminalPolicy) < 0.01;
    let best = points;
    const currentLength = routeLength(points);
    let found = false;
    const xLanes = lane('x'),
      yLanes = lane('y');
    const consider = (replacement: Point[], i: number, j: number) => {
      const route = compactRoute([...points.slice(0, i), ...replacement, ...points.slice(j + 1)]);
      if (
        (initialSafe || found) &&
        (route.length > best.length ||
          (route.length === best.length && routeLength(route) >= routeLength(best) - 0.1))
      ) {
        return;
      }
      if (initialSafe && routeLength(route) > currentLength + 0.1) {
        return;
      }
      if (!initialSafe && !found && route.length > points.length + 4) {
        return;
      }
      if (
        heading(route[0], route[1]) !== first ||
        heading(route[route.length - 2], route[route.length - 1]) !== last
      ) {
        return;
      }
      if (
        anchorLimits.some(({ point, distance }) => distanceToRoute(point, route) > distance + 0.1)
      ) {
        return;
      }
      if (
        route.some(
          (p, k) =>
            k > 1 &&
            Math.abs(
              (route[k - 1].x - route[k - 2].x) * (p.y - route[k - 1].y) -
                (route[k - 1].y - route[k - 2].y) * (p.x - route[k - 1].x)
            ) < EPS &&
            (route[k - 1].x - route[k - 2].x) * (p.x - route[k - 1].x) +
              (route[k - 1].y - route[k - 2].y) * (p.y - route[k - 1].y) <
              0
        )
      ) {
        return;
      }
      if (
        route.some(
          (p, k) =>
            k &&
            ((k !== 1 &&
              terminalPolicy.startBounds &&
              segmentHitsTitle(route[k - 1], p, terminalPolicy.startBounds)) ||
              (k !== route.length - 1 &&
                terminalPolicy.endBounds &&
                segmentHitsTitle(route[k - 1], p, terminalPolicy.endBounds)))
        )
      ) {
        return;
      }
      if (terminalDeficit(route, terminalPolicy) > 0.01) {
        return;
      }
      if (findFrameOverlaps(route, frames).length) {
        return;
      }
      // Validate every new segment. Unchanged portions may pass conservative
      // shape bounding boxes at legitimate non-rectangular attachment points.
      const local = compactRoute(replacement);
      if (
        local.some((p, k) => k && obstacles.some((box) => segmentHitsTitle(local[k - 1], p, box)))
      ) {
        return;
      }
      if (crossings(route, others) > ceiling || crossings(route, [route]) > selfCeiling) {
        return;
      }
      best = route;
      found = true;
    };
    // Try reserved port stubs as a whole-route candidate. This permits the
    // minimum extra elbows when the old one-elbow route cannot fit a head.
    if (!initialSafe) {
      const a = points[0],
        b = points.at(-1)!,
        { s, t } = portStubs();
      const starts = [
        s,
        ...labelAnchors.map((p) => ({
          x: first === 'R' ? p.x + 8 : first === 'L' ? p.x - 8 : s.x,
          y: first === 'D' ? p.y + 8 : first === 'U' ? p.y - 8 : s.y,
        })),
      ];
      for (const lead of starts) {
        consider([a, lead, { x: lead.x, y: t.y }, t, b], 0, points.length - 1);
        consider([a, lead, { x: t.x, y: lead.y }, t, b], 0, points.length - 1);
        for (const x of xLanes) {
          consider([a, lead, { x, y: lead.y }, { x, y: t.y }, t, b], 0, points.length - 1);
        }
        for (const y of yLanes) {
          consider([a, lead, { x: lead.x, y }, { x: t.x, y }, t, b], 0, points.length - 1);
        }
      }
    }
    search: for (let span = points.length - 1; span >= 2; span--) {
      for (let i = 0; i + span < points.length; i++) {
        if (!initialSafe && i !== 0 && i + span !== points.length - 1) {
          continue;
        }
        const j = i + span,
          a = points[i],
          b = points[j];
        if (Math.abs(a.x - b.x) < EPS || Math.abs(a.y - b.y) < EPS) {
          consider([a, b], i, j);
        }
        consider([a, { x: a.x, y: b.y }, b], i, j);
        consider([a, { x: b.x, y: a.y }, b], i, j);
        for (const x of xLanes) {
          consider([a, { x, y: a.y }, { x, y: b.y }, b], i, j);
        }
        for (const y of yLanes) {
          consider([a, { x: a.x, y }, { x: b.x, y }, b], i, j);
        }
        if (found && best.length - 2 <= lowerBound) {
          break search;
        }
      }
    }
    if (!found || JSON.stringify(best) === JSON.stringify(points)) {
      break;
    }
    points = best;
    if (points.length - 2 <= lowerBound) {
      break;
    }
  }
  return points;
}
