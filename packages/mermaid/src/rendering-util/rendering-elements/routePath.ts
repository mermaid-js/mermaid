// Ported from Pele (https://github.com/obsidianmd/pele), src/svg/edges.ts at 3a2f075.
// Copyright (c) 2026 kepano. MIT License: see THIRD_PARTY_NOTICES.
// Ported from mermaid-v13 `packages/diagram-flowchart/src/render/edges.ts` (`routePath`,
// `curveKind`). Changes: the SvgWriter is replaced by a local path-string builder, `d` is a plain
// string, and v13's inline arrowhead drawing is left out (mermaid draws `<marker>`s). The end
// trim comes from mermaid's own marker offsets (`markerTrim`). The algorithm is unchanged.
// cspell:ignore kepano
//
// Draws an edge from axis-tagged route points: one S along the flow between two points not in
// line, rounded corners where the route turns, and square ends. Any layout whose edges carry
// axis-tagged points gets this path; it is chosen by the data, not by the layout's name.
import { markerOffsets } from '../../utils/lineWithOffset.js';

/** A route point and the axis the route travels along when it arrives there. */
export interface RoutePoint {
  x: number;
  y: number;
  axis: 'v' | 'h';
}

/** True when every point of a route carries an axis tag, so `routePath` can draw it. */
export function isAxisTaggedRoute(points: unknown): points is RoutePoint[] {
  return (
    Array.isArray(points) &&
    points.length >= 2 &&
    points.every(
      (p) =>
        p !== null &&
        typeof p === 'object' &&
        ((p as RoutePoint).axis === 'v' || (p as RoutePoint).axis === 'h')
    )
  );
}

// How far an edge runs straight before a marker at its end, where it has the room.
const LEAD = 6;
// The most a corner is rounded by in a stepped route.
const CORNER = 12;
// The radius of the arc at a corner of a rounded route (v12's `rounded` curve), less where a
// leg is too short for it.
const RADIUS = 5;
// How far the handles of a wide turn reach along its two legs.
const HANDLE = 0.62;

/** How the line between two route points is drawn, from the v12 `curve` name. */
export type CurveKind = 'curved' | 'linear' | 'step' | 'stepBefore' | 'stepAfter' | 'rounded';

export function curveKind(curve: string | undefined): CurveKind {
  return curve === 'linear' ||
    curve === 'step' ||
    curve === 'stepBefore' ||
    curve === 'stepAfter' ||
    curve === 'rounded'
    ? curve
    : 'curved';
}

/**
 * How far the line stops short of its end for a mermaid marker of this type, so the marker
 * (drawn by `<marker>` with its own refX) meets the node outline. Same offsets the other edge
 * curves use; unknown or absent markers trim nothing.
 */
export function markerTrim(type: string | undefined): number {
  return type ? ((markerOffsets as Partial<Record<string, number>>)[type] ?? 0) : 0;
}

export interface EdgePath {
  d: string;
  /** Start tip and the way a start marker points. */
  sx: number;
  sy: number;
  sdx: number;
  sdy: number;
  /** End tip and the way an end marker points. */
  ex: number;
  ey: number;
  edx: number;
  edy: number;
}

// The S-curve handle factor of the layered engine's `ease`.
// TODO(layered 03): import `ease` from the ported layered engine and drop this copy.
const ease = (across: number, along: number): number =>
  Math.max(0.25, Math.min(0.5, (4 * Math.abs(along)) / (Math.abs(across) || 1)));

// Formats a finite number to at most two decimals, without trailing zeros (v13's `num`).
function num(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Cannot write the number ${value} into SVG`);
  }
  const n = Math.round(value * 100) / 100;
  return n === 0 ? '0' : String(n);
}

/** Path data built from numbers (the subset of v13's PathBuilder that routePath uses). */
class PathBuilder {
  private d = '';
  moveTo(x: number, y: number): this {
    this.d += 'M' + num(x) + ',' + num(y);
    return this;
  }
  lineTo(x: number, y: number): this {
    this.d += 'L' + num(x) + ',' + num(y);
    return this;
  }
  curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): this {
    this.d +=
      'C' + num(x1) + ',' + num(y1) + ' ' + num(x2) + ',' + num(y2) + ' ' + num(x) + ',' + num(y);
    return this;
  }
  quadTo(x1: number, y1: number, x: number, y: number): this {
    this.d += 'Q' + num(x1) + ',' + num(y1) + ' ' + num(x) + ',' + num(y);
    return this;
  }
  arcTo(
    rx: number,
    ry: number,
    rotation: number,
    large: boolean,
    sweep: boolean,
    x: number,
    y: number
  ): this {
    this.d +=
      'A' +
      num(rx) +
      ',' +
      num(ry) +
      ' ' +
      num(rotation) +
      ' ' +
      (large ? '1' : '0') +
      ',' +
      (sweep ? '1' : '0') +
      ' ' +
      num(x) +
      ',' +
      num(y);
    return this;
  }
  done(): string {
    return this.d;
  }
}

// Where a step curve turns between two coordinates: at the start, the end or halfway.
function stepCorner(kind: CurveKind, from: number, to: number): number {
  if (kind === 'stepBefore') {
    return from;
  }
  if (kind === 'stepAfter') {
    return to;
  }
  return (from + to) / 2;
}

/**
 * The path for a route, trimmed at both ends to leave room for markers. Between two points
 * not in line the route is one S along the flow (or a step in a stepped route); where the
 * route turns a corner it is rounded.
 */
export function routePath(
  route: readonly RoutePoint[],
  kind: CurveKind,
  startTrim: number,
  endTrim: number
): EdgePath {
  const linear = kind === 'linear';
  const stepped = kind === 'step' || kind === 'stepBefore' || kind === 'stepAfter';
  const cornered = stepped || kind === 'rounded';
  const xs: number[] = [];
  const ys: number[] = [];
  const axes: number[] = [];
  const near = (ax: number, ay: number, bx: number, by: number): boolean =>
    Math.abs(ax - bx) < 0.01 && Math.abs(ay - by) < 0.01;
  for (const p of route) {
    const axis = p.axis === 'h' ? 1 : 0;
    const prev = xs.length - 1;
    if (
      stepped &&
      prev >= 0 &&
      Math.abs(p.x - xs[prev]) >= 0.01 &&
      Math.abs(p.y - ys[prev]) >= 0.01
    ) {
      const px = xs[prev];
      const py = ys[prev];
      const my = stepCorner(kind, py, p.y);
      const mx = stepCorner(kind, px, p.x);
      const corners = axis === 0 ? [px, my, p.x, my] : [mx, py, mx, p.y];
      for (let k = 0; k < 4; k += 2) {
        if (
          near(corners[k], corners[k + 1], px, py) ||
          near(corners[k], corners[k + 1], p.x, p.y)
        ) {
          continue;
        }
        xs.push(corners[k]);
        ys.push(corners[k + 1]);
        axes.push(axis);
      }
    }
    xs.push(p.x);
    ys.push(p.y);
    axes.push(axis);
  }
  let last = xs.length - 1;
  const X = (i: number): number => xs[i];
  const Y = (i: number): number => ys[i];
  const aligned = (i: number): boolean =>
    Math.abs(X(i) - X(i - 1)) < 0.01 || Math.abs(Y(i) - Y(i - 1)) < 0.01;
  const straight = (i: number): boolean => linear || kind === 'rounded' || aligned(i);
  const unit = (i: number, j: number, axis: number): [number, number] => {
    if (!straight(Math.max(i, j))) {
      return axis === 0 ? [0, Math.sign(Y(j) - Y(i)) || 1] : [Math.sign(X(j) - X(i)) || 1, 0];
    }
    const dx = X(j) - X(i);
    const dy = Y(j) - Y(i);
    const len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  };
  const [sdx, sdy] = unit(0, 1, axes[1] ?? 0);
  const [edx, edy] = unit(last - 1, last, axes[last] ?? 0);
  const sx = X(0);
  const sy = Y(0);
  const ex = X(last);
  const ey = Y(last);
  xs[0] = sx + sdx * startTrim;
  ys[0] = sy + sdy * startTrim;
  xs[last] = ex - edx * endTrim;
  ys[last] = ey - edy * endTrim;
  const length = (i: number): number => Math.abs(X(i) - X(i - 1)) + Math.abs(Y(i) - Y(i - 1));
  const turns = (i: number): boolean =>
    !linear &&
    i > 0 &&
    i < last &&
    aligned(i) &&
    aligned(i + 1) &&
    length(i) >= 0.01 &&
    length(i + 1) >= 0.01 &&
    Math.abs(X(i) - X(i - 1)) < 0.01 !== Math.abs(X(i + 1) - X(i)) < 0.01;
  const along = (i: number, ux: number, uy: number): number =>
    Math.abs(X(i) - X(i - 1)) * Math.abs(ux) + Math.abs(Y(i) - Y(i - 1)) * Math.abs(uy);
  // A curve into a marker runs straight for a little way first, where there is room.
  const lead = (run: number): number => Math.min(LEAD, run / 4);
  const arrives =
    endTrim > 0 && (!straight(last) || turns(last - 1)) ? lead(along(last, edx, edy)) : 0;
  const leaves = startTrim > 0 && (!straight(1) || turns(1)) ? lead(along(1, sdx, sdy)) : 0;
  if (arrives >= 1) {
    xs.splice(last, 0, X(last) - edx * arrives);
    ys.splice(last, 0, Y(last) - edy * arrives);
    axes.splice(last, 0, axes[last]);
    last++;
  }
  if (leaves >= 1) {
    xs.splice(1, 0, X(0) + sdx * leaves);
    ys.splice(1, 0, Y(0) + sdy * leaves);
    axes.splice(1, 0, axes[1]);
    last++;
  }

  const b = new PathBuilder().moveTo(X(0), Y(0));
  let atX = X(0);
  let atY = Y(0);
  const lineTo = (x: number, y: number): void => {
    if (near(x, y, atX, atY)) {
      return;
    }
    b.lineTo(x, y);
    atX = x;
    atY = y;
  };
  for (let i = 1; i <= last; i++) {
    const x = X(i);
    const y = Y(i);
    if (!straight(i)) {
      const down = axes[i] === 0;
      const run = down ? y - atY : x - atX;
      const k = Math.abs(run) * ease(down ? x - atX : y - atY, run);
      const ux = down ? 0 : Math.sign(run) * k;
      const uy = down ? Math.sign(run) * k : 0;
      b.curveTo(atX + ux, atY + uy, x - ux, y - uy, x, y);
      atX = x;
      atY = y;
      continue;
    }
    if (!turns(i)) {
      // A point part of the way along one straight run adds nothing.
      if (
        i < last &&
        aligned(i) &&
        aligned(i + 1) &&
        (x - X(i - 1)) * (X(i + 1) - x) + (y - Y(i - 1)) * (Y(i + 1) - y) > 0
      ) {
        continue;
      }
      lineTo(x, y);
      continue;
    }
    let before = turns(i - 1) ? length(i) / 2 : length(i);
    let after = turns(i + 1) ? length(i + 1) / 2 : length(i + 1);
    if (cornered) {
      before = after = Math.min(kind === 'rounded' ? RADIUS : CORNER, before, after);
    }
    const [ux, uy] = unit(i - 1, i, axes[i]);
    const [vx, vy] = unit(i, i + 1, axes[i + 1]);
    lineTo(x - ux * before, y - uy * before);
    atX = x + vx * after;
    atY = y + vy * after;
    // A right-angle turn, so the arc's radius is its leg; the sweep follows the turn (y down).
    if (kind === 'rounded') {
      b.arcTo(before, before, 0, false, ux * vy - uy * vx > 0, atX, atY);
    } else if (cornered) {
      b.quadTo(x, y, atX, atY);
    } else {
      b.curveTo(
        x - ux * before * (1 - HANDLE),
        y - uy * before * (1 - HANDLE),
        x + vx * after * (1 - HANDLE),
        y + vy * after * (1 - HANDLE),
        atX,
        atY
      );
    }
  }
  return { d: b.done(), sx, sy, sdx: -sdx, sdy: -sdy, ex, ey, edx, edy };
}
