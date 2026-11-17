// Ported from mermaid-v13 `packages/core/src/layout/validate.ts`.
// Engine-agnostic checks on a LayoutModel, for DDLT-style tests of any layout engine: every
// coordinate finite, everything placed inside the drawing, no boxes overlapping, groups holding
// their members, and edges starting and ending at their own boxes. `countCrossings` gives a
// quality number to record per fixture.
//
// Test support only: used by the ported v13 specs, not exported from the module and not used at
// runtime. Mermaid's runtime and sweep quality checks are DDLT's `validateLayout`.
import type { LayoutGraph, LayoutModel, Point } from './types.js';

// How far apart two boxes may overlap, or a point may lie off a box, and still count as clear.
const SLACK = 0.5;

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function rect(b: { x: number; y: number; width: number; height: number }): Rect {
  return {
    x0: b.x - b.width / 2,
    y0: b.y - b.height / 2,
    x1: b.x + b.width / 2,
    y1: b.y + b.height / 2,
  };
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x0 < b.x1 - SLACK && b.x0 < a.x1 - SLACK && a.y0 < b.y1 - SLACK && b.y0 < a.y1 - SLACK;
}

function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x0 >= outer.x0 - SLACK &&
    inner.y0 >= outer.y0 - SLACK &&
    inner.x1 <= outer.x1 + SLACK &&
    inner.y1 <= outer.y1 + SLACK
  );
}

function near(r: Rect, p: Point): boolean {
  return p.x >= r.x0 - SLACK && p.x <= r.x1 + SLACK && p.y >= r.y0 - SLACK && p.y <= r.y1 + SLACK;
}

/** Returns one message per problem; an empty list means the model is valid for the graph. */
export function validateLayout(graph: LayoutGraph, model: LayoutModel): string[] {
  const problems: string[] = [];
  const bad = (v: number): boolean => !Number.isFinite(v);
  if (bad(model.width) || bad(model.height) || model.width < 0 || model.height < 0) {
    problems.push(`drawing width/height not finite: ${model.width} x ${model.height}`);
  }
  const page: Rect = { x0: 0, y0: 0, x1: model.width, y1: model.height };

  // Boxes by id, with the chain of groups each sits in.
  const boxes = new Map<string, Rect>();
  const parent = new Map<string, string | undefined>();
  const place = (
    kind: string,
    id: string,
    b: { x: number; y: number; width: number; height: number } | undefined,
    up: string | undefined
  ): void => {
    if (!b) {
      problems.push(`missing ${kind} '${id}'`);
      return;
    }
    if ([b.x, b.y, b.width, b.height].some(bad)) {
      problems.push(`${kind} '${id}' has a non-finite coordinate`);
      return;
    }
    const r = rect(b);
    if (!contains(page, r)) problems.push(`${kind} '${id}' lies outside the drawing`);
    boxes.set(id, r);
    parent.set(id, up);
  };
  for (const n of graph.nodes) place('node', n.id, model.nodes.get(n.id), n.parent);
  for (const g of graph.groups) {
    const placed = model.groups.get(g.id);
    place('group', g.id, placed, g.parent);
    if (placed && (bad(placed.title.x) || bad(placed.title.y))) {
      problems.push(`group '${g.id}' title has a non-finite coordinate`);
    }
  }
  const groupIds = new Set(graph.groups.map((g) => g.id));
  const ancestors = (id: string): Set<string> => {
    const out = new Set<string>();
    for (
      let p = parent.get(id);
      p !== undefined && groupIds.has(p) && !out.has(p);
      p = parent.get(p)
    ) {
      out.add(p);
    }
    return out;
  };

  const ids = [...boxes.keys()];
  const chains = new Map(ids.map((id) => [id, ancestors(id)]));
  for (const id of ids) {
    for (const g of chains.get(id)!) {
      if (!contains(boxes.get(g)!, boxes.get(id)!))
        problems.push(`'${id}' lies outside its group '${g}'`);
    }
  }
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]!;
      const b = ids[j]!;
      if (chains.get(a)!.has(b) || chains.get(b)!.has(a)) continue;
      if (overlaps(boxes.get(a)!, boxes.get(b)!)) problems.push(`'${a}' and '${b}' overlap`);
    }
  }

  for (const e of graph.edges) {
    const placed = model.edges.get(e.id);
    if (!placed) {
      problems.push(`missing edge '${e.id}'`);
      continue;
    }
    if (
      placed.points.some((p) => bad(p.x) || bad(p.y)) ||
      (placed.label && (bad(placed.label.x) || bad(placed.label.y)))
    ) {
      problems.push(`edge '${e.id}' has a non-finite coordinate`);
      continue;
    }
    if (placed.points.length < 2) {
      problems.push(`edge '${e.id}' has fewer than two points`);
      continue;
    }
    for (const p of placed.points) {
      if (!near(page, p)) {
        problems.push(`edge '${e.id}' runs outside the drawing`);
        break;
      }
    }
    const from = boxes.get(e.source);
    const to = boxes.get(e.target);
    if (from && !near(from, placed.points[0]!))
      problems.push(`edge '${e.id}' does not start at its source`);
    if (to && !near(to, placed.points[placed.points.length - 1]!)) {
      problems.push(`edge '${e.id}' does not end at its target`);
    }
    if (e.label && !placed.label) problems.push(`edge '${e.id}' has a label but no label position`);
    if (e.label && placed.label) {
      const r = rect({ ...placed.label, ...e.label });
      for (const n of graph.nodes) {
        const b = boxes.get(n.id);
        if (b && overlaps(r, b)) problems.push(`label of edge '${e.id}' overlaps node '${n.id}'`);
      }
    }
  }
  return problems;
}

function cross(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d2 = (b.x - a.x) * (d.y - a.y) - (b.y - a.y) * (d.x - a.x);
  const d3 = (d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x);
  const d4 = (d.x - c.x) * (b.y - c.y) - (d.y - c.y) * (b.x - c.x);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function same(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < SLACK && Math.abs(a.y - b.y) < SLACK;
}

/**
 * Counts pairs of edges whose routes, taken as polylines, properly cross. Edges that share an
 * end point are not compared, since they fan out of one place. Each pair counts once.
 */
export function countCrossings(model: LayoutModel): number {
  const routes = [...model.edges.values()].map((e) => e.points).filter((p) => p.length >= 2);
  let count = 0;
  for (let i = 0; i < routes.length; i++) {
    const a = routes[i]!;
    for (let j = i + 1; j < routes.length; j++) {
      const b = routes[j]!;
      const ends = [a[0]!, a[a.length - 1]!];
      if (ends.some((p) => same(p, b[0]!) || same(p, b[b.length - 1]!))) continue;
      let hit = false;
      for (let s = 0; s + 1 < a.length && !hit; s++) {
        for (let t = 0; t + 1 < b.length && !hit; t++)
          hit = cross(a[s]!, a[s + 1]!, b[t]!, b[t + 1]!);
      }
      if (hit) count++;
    }
  }
  return count;
}
