// Based on Pele (https://github.com/obsidianmd/pele).
// Copyright (c) 2026 kepano. MIT License: see packages/mermaid/THIRD_PARTY_NOTICES.
// Ported from mermaid-v13 `packages/core/src/layout/layered/index.ts`.
// The `layered` engine: LayoutGraph → LayoutModel over the compound layout ported from Pele.
// The `availableWidth` handling follows Pele's src/diagrams/common/fit-width.ts (`tighten`,
// then `turnToFit`), applied to the layout instead of to a whole render.
// cspell:ignore kepano cnode cnodes cedges
import type {
  Dir,
  LayoutContext,
  LayoutEngine,
  LayoutGraph,
  LayoutModel,
  LayoutModelEdge,
  LayoutModelGroup,
  LayoutModelNode,
  RoutePoint,
  Side,
} from './types.js';
import {
  cnode,
  compoundLayout,
  inheritCrossedDirections,
  type CEdge,
  type CNode,
} from './compound.js';
import type { LayeredOptions } from './layered.js';

// The room between edge ends spread along one side of a node.
const PORT_SEP = 20;
// How far a self-loop reaches out from its node.
const LOOP = 26;
// Room between a self-loop and its label.
const LOOP_GAP = 6;
// The part of a side that edge ends keep clear of at each corner when the node sets no span.
const CORNER = 12;
// A drawing that runs across is turned to run down only when the width budget is under this.
export const TURN_BREAKPOINT = 640;
// Tight layouts (`availableWidth`): node and rank spacing and group padding are scaled by these.
const TIGHT_NODE = 0.5;
const TIGHT_RANK = 0.75;
const TIGHT_PAD = 0.6;

/** The spacing keys of a diagram's resolved config (flowchart: `nodeSpacing`, …). */
export interface SpacingConfig {
  nodeSpacing?: number;
  rankSpacing?: number;
  diagramPadding?: number;
}

/** v12's defaults (R-LAYOUT-6). v12 sets no edge spacing, so dagre's 20 applies. */
export const V12_SPACING = {
  nodeSpacing: 50,
  rankSpacing: 50,
  edgeSpacing: 20,
  diagramPadding: 8,
} as const;

/** The LayoutGraph spacing fields for a diagram's resolved config, with v12 defaults. */
export function layoutSettings(config: SpacingConfig = {}): {
  spacing: LayoutGraph['spacing'];
  diagramPadding: number;
} {
  return {
    spacing: {
      node: config.nodeSpacing ?? V12_SPACING.nodeSpacing,
      rank: config.rankSpacing ?? V12_SPACING.rankSpacing,
      edge: V12_SPACING.edgeSpacing,
    },
    diagramPadding: config.diagramPadding ?? V12_SPACING.diagramPadding,
  };
}

export const layered: LayoutEngine = (graph: LayoutGraph, ctx?: LayoutContext): LayoutModel => {
  void ctx;
  check(graph);
  const available = graph.availableWidth;
  const across = tighten(graph, graph.direction);
  if (available === undefined || !(available > 0) || across.width <= available) return across;
  if (!runsAcross(graph.direction) || available >= TURN_BREAKPOINT) return across;
  const down = tighten(graph, 'TB');
  return down.width < across.width ? down : across;
};

function runsAcross(dir: Dir): boolean {
  return dir === 'LR' || dir === 'RL';
}

// Lays out with room to spare, and tightly instead when that does not fit and tight is narrower.
function tighten(graph: LayoutGraph, dir: Dir): LayoutModel {
  const loose = run(graph, dir, false);
  const available = graph.availableWidth;
  if (available === undefined || !(available > 0) || loose.width <= available) return loose;
  const tight = run(graph, dir, true);
  return tight.width < loose.width ? tight : loose;
}

function finite(value: number, what: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`layout: ${what} must be a finite number >= 0, got ${value}`);
  }
}

function check(graph: LayoutGraph): void {
  const ids = new Set<string>();
  const add = (id: string, what: string): void => {
    if (ids.has(id)) throw new Error(`layout: duplicate ${what} id '${id}'`);
    ids.add(id);
  };
  for (const n of graph.nodes) {
    add(n.id, 'node');
    finite(n.width, `width of node '${n.id}'`);
    finite(n.height, `height of node '${n.id}'`);
    if (n.span !== undefined) finite(n.span, `span of node '${n.id}'`);
  }
  for (const g of graph.groups) {
    add(g.id, 'group');
    const { top, right, bottom, left } = g.padding;
    for (const v of [top, right, bottom, left]) finite(v, `padding of group '${g.id}'`);
    if (g.title) {
      finite(g.title.width, `title width of group '${g.id}'`);
      finite(g.title.height, `title height of group '${g.id}'`);
    }
  }
  const edges = new Set<string>();
  for (const e of graph.edges) {
    if (edges.has(e.id)) throw new Error(`layout: duplicate edge id '${e.id}'`);
    edges.add(e.id);
    if (!ids.has(e.source))
      throw new Error(`layout: edge '${e.id}' has unknown source '${e.source}'`);
    if (!ids.has(e.target))
      throw new Error(`layout: edge '${e.id}' has unknown target '${e.target}'`);
    finite(e.minLen, `minLen of edge '${e.id}'`);
    if (e.label) {
      finite(e.label.width, `label width of edge '${e.id}'`);
      finite(e.label.height, `label height of edge '${e.id}'`);
    }
  }
  const { node, rank, edge } = graph.spacing;
  finite(node, 'spacing.node');
  finite(rank, 'spacing.rank');
  finite(edge, 'spacing.edge');
  if (graph.diagramPadding !== undefined) finite(graph.diagramPadding, 'diagramPadding');
  if (graph.headRoom !== undefined) finite(graph.headRoom, 'headRoom');
}

function run(graph: LayoutGraph, rootDir: Dir, tight: boolean): LayoutModel {
  const padScale = tight ? TIGHT_PAD : 1;
  const nodeCount = graph.nodes.length;
  const index = new Map<string, number>();
  const cnodes: CNode[] = [];
  graph.nodes.forEach((n, i) => {
    index.set(n.id, i);
    const c = cnode(n.width, n.height);
    c.seq = i;
    cnodes.push(c);
  });
  // Pele places the title in the top padding: half of `padding.top` above it, half below.
  const padTops: number[] = [];
  graph.groups.forEach((g, j) => {
    index.set(g.id, nodeCount + j);
    const c = cnode(0, 0);
    c.isGroup = true;
    c.dir = g.direction;
    c.padX = Math.max(g.padding.left, g.padding.right) * padScale;
    const padTop = g.padding.top * padScale;
    padTops.push(padTop);
    c.padTop = padTop + (g.title?.height ?? 0);
    c.padBottom = g.padding.bottom * padScale;
    c.minW = (g.title?.width ?? 0) + 2 * c.padX;
    c.seq = nodeCount + j;
    c.span = Infinity;
    cnodes.push(c);
  });
  const parentOf = (id: string | undefined): number => {
    if (id === undefined) return -1;
    const p = index.get(id);
    return p !== undefined && p >= nodeCount ? p : -1;
  };
  graph.nodes.forEach((n, i) => (cnodes[i]!.parent = parentOf(n.parent)));
  graph.groups.forEach((g, j) => (cnodes[nodeCount + j]!.parent = parentOf(g.parent)));

  const ends = graph.edges.map((e) => [index.get(e.source)!, index.get(e.target)!] as const);
  inheritCrossedDirections(cnodes, ends);

  const sideways = (i: number): boolean => {
    let dir: Dir | undefined;
    const seen = new Set<number>();
    for (
      let p = cnodes[i]!.parent;
      p >= 0 && dir === undefined && !seen.has(p);
      p = cnodes[p]!.parent
    ) {
      seen.add(p);
      dir = cnodes[p]!.dir;
    }
    return runsAcross(dir ?? rootDir);
  };
  graph.nodes.forEach((n, i) => {
    const across = sideways(i) ? n.height : n.width;
    cnodes[i]!.span = n.span ?? Math.max(0, across - 2 * CORNER);
  });

  // A self-loop sits beside its node, across the flow; the box laid out grows to hold it.
  const loopSide = new Uint8Array(cnodes.length);
  const cedges: CEdge[] = graph.edges.map((e, k) => {
    const [src, dst] = ends[k]!;
    const labelW = e.label?.width ?? 0;
    const labelH = e.label?.height ?? 0;
    if (src === dst && src < nodeCount) {
      const c = cnodes[src]!;
      if (sideways(src)) {
        c.h += 2 * (LOOP + (labelH > 0 ? labelH + LOOP_GAP : 0));
        loopSide[src] = 2;
      } else {
        c.w += 2 * (LOOP + (labelW > 0 ? labelW + LOOP_GAP : 0));
        loopSide[src] = 1;
      }
    }
    return {
      src,
      dst,
      minlen: Math.max(1, Math.round(e.minLen)),
      labelW,
      labelH,
      route: [],
      labelX: 0,
      labelY: 0,
    };
  });

  const routing = graph.routing ?? 'curved';
  const opt: LayeredOptions = {
    nodeSep: graph.spacing.node * (tight ? TIGHT_NODE : 1),
    edgeSep: graph.spacing.edge,
    rankSep: graph.spacing.rank * (tight ? TIGHT_RANK : 1),
    portSep: PORT_SEP,
    tracks: routing === 'stepped',
    straight: routing === 'straight',
    headRoom: graph.headRoom ?? 0,
  };
  const total = compoundLayout(cnodes, cedges, rootDir, opt);

  const pad = graph.diagramPadding ?? 0;
  const nodes = new Map<string, LayoutModelNode>();
  graph.nodes.forEach((n, i) => {
    const c = cnodes[i]!;
    nodes.set(n.id, { x: c.x + pad, y: c.y + pad, width: n.width, height: n.height });
  });
  const groups = new Map<string, LayoutModelGroup>();
  graph.groups.forEach((g, j) => {
    const c = cnodes[nodeCount + j]!;
    const x = c.x + pad;
    const y = c.y + pad;
    const top = y - c.h / 2;
    const titleY = top + padTops[j]! / 2 + (g.title?.height ?? 0) / 2;
    groups.set(g.id, { x, y, width: c.w, height: c.h, title: { x, y: titleY } });
  });

  const box = (i: number): LayoutModelNode => {
    const c = cnodes[i]!;
    const size = i < nodeCount ? graph.nodes[i]! : { width: c.w, height: c.h };
    return { x: c.x + pad, y: c.y + pad, width: size.width, height: size.height };
  };
  const edges = new Map<string, LayoutModelEdge>();
  graph.edges.forEach((e, k) => {
    const ce = cedges[k]!;
    const [src, dst] = ends[k]!;
    if (src === dst) {
      edges.set(e.id, selfLoop(box(src), loopSide[src] === 2, e.label));
      return;
    }
    const points: RoutePoint[] = [];
    for (let p = 0; p + 2 < ce.route.length; p += 3) {
      points.push({
        x: ce.route[p]! + pad,
        y: ce.route[p + 1]! + pad,
        axis: ce.route[p + 2] === 1 ? 'h' : 'v',
      });
    }
    const model: LayoutModelEdge = {
      points,
      ports: {
        source: sideOf(box(src), points[0], flowEnd(rootDir)),
        target: sideOf(box(dst), points[points.length - 1], flowStart(rootDir)),
      },
    };
    if (ce.labelW > 0 || ce.labelH > 0) model.label = { x: ce.labelX + pad, y: ce.labelY + pad };
    edges.set(e.id, model);
  });

  return {
    width: total.width + 2 * pad,
    height: total.height + 2 * pad,
    nodes,
    edges,
    groups,
    direction: rootDir,
  };
}

const FLOW_START: Readonly<Record<Dir, Side>> = {
  TB: 'top',
  BT: 'bottom',
  LR: 'left',
  RL: 'right',
};
const FLOW_END: Readonly<Record<Dir, Side>> = { TB: 'bottom', BT: 'top', LR: 'right', RL: 'left' };

function flowStart(dir: Dir): Side {
  return FLOW_START[dir];
}

function flowEnd(dir: Dir): Side {
  return FLOW_END[dir];
}

// The side of a box that a route end lies on, or the nearest one.
function sideOf(b: LayoutModelNode, p: RoutePoint | undefined, fallback: Side): Side {
  if (!p) return fallback;
  const dx = p.x - b.x;
  const dy = p.y - b.y;
  const rx = b.width > 0 ? Math.abs(dx) / (b.width / 2) : Math.abs(dx);
  const ry = b.height > 0 ? Math.abs(dy) / (b.height / 2) : Math.abs(dy);
  if (rx < 1e-6 && ry < 1e-6) return fallback;
  if (ry >= rx) return dy < 0 ? 'top' : 'bottom';
  return dx < 0 ? 'left' : 'right';
}

// A loop out of one side of a node and back, beside it across the flow.
function selfLoop(
  b: LayoutModelNode,
  below: boolean,
  label: { width: number; height: number } | undefined
): LayoutModelEdge {
  if (below) {
    const y = b.y + b.height / 2;
    const out = y + LOOP;
    const x0 = b.x - b.width / 4;
    const x1 = b.x + b.width / 4;
    return {
      points: [
        { x: x0, y, axis: 'v' },
        { x: x0, y: out, axis: 'v' },
        { x: x1, y: out, axis: 'h' },
        { x: x1, y, axis: 'v' },
      ],
      ...(label ? { label: { x: b.x, y: out + LOOP_GAP + label.height / 2 } } : {}),
      ports: { source: 'bottom', target: 'bottom' },
    };
  }
  const x = b.x + b.width / 2;
  const out = x + LOOP;
  const y0 = b.y - b.height / 4;
  const y1 = b.y + b.height / 4;
  return {
    points: [
      { x, y: y0, axis: 'h' },
      { x: out, y: y0, axis: 'h' },
      { x: out, y: y1, axis: 'v' },
      { x, y: y1, axis: 'h' },
    ],
    ...(label ? { label: { x: out + LOOP_GAP + label.width / 2, y: b.y } } : {}),
    ports: { source: 'right', target: 'right' },
  };
}
