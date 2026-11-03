// Thin adapters between mermaid's `LayoutData` and the `layered` engine's own contract:
// `LayoutData` (after DOM measurement) → `LayoutGraph`, and `LayoutModel` → positions and
// axis-tagged routes on the `LayoutData` nodes and edges. Route ends come out of the engine on
// the node's bounding box; `clipRouteEnds` moves them onto the drawn shape with the shape's own
// `intersect`, along the flow only, so each end keeps the side and port the engine chose.
import type { Edge, LayoutData, Node } from '../../types.js';
import { layered, layoutSettings } from './index.js';
import type {
  Dir,
  LayoutEdge,
  LayoutGraph,
  LayoutGroup,
  LayoutModel,
  LayoutNode,
  RoutePoint,
} from './types.js';

// Room around an edge label, as v13 gives it (`LABEL_W`, `LABEL_H`).
const LABEL_W = 12;
const LABEL_H = 4;
// The room an arrowhead takes at an edge's head (v13 `HEAD_ROOM`).
const HEAD_ROOM = 7;

// Room between a subgraph's border and its content (v13 `GROUP_PAD`), and between its title
// and its content.
const GROUP_PAD = 20;
const TITLE_GAP = 12;

const DIRS: Record<string, Dir> = { TB: 'TB', TD: 'TB', BT: 'BT', LR: 'LR', RL: 'RL' };

function direction(data: LayoutData): Dir {
  return DIRS[String(data.direction ?? '').toUpperCase()] ?? 'TB';
}

const sideways = (dir: Dir): boolean => dir === 'LR' || dir === 'RL';

// How much of the side edges meet may be shared out between edge ends, for shapes that are
// narrower there than their box (v13 `shapeSpan`). Other shapes keep the engine's default.
type Span = (w: number, h: number, sideways: boolean) => number;
const roundSpan: Span = (w, h, s) => (s ? h : w) * 0.6;
const SPANS = new Map<string, Span>([
  ...[
    'circle',
    'circ',
    'doublecircle',
    'double-circle',
    'dbl-circ',
    'ellipse',
    'diamond',
    'diam',
    'decision',
    'question',
    'sm-circ',
    'small-circle',
    'start',
    'fr-circ',
    'framed-circle',
    'stop',
    'f-circ',
    'filled-circle',
    'junction',
    'cross-circ',
    'crossed-circle',
    'summary',
  ].map((name) => [name, roundSpan] as const),
  ...['stadium', 'terminal', 'pill'].map(
    (name) => [name, ((w, h, s) => (s ? h * 0.6 : w - h)) as Span] as const
  ),
  ...['hexagon', 'hex', 'prepare'].map(
    (name) => [name, ((w, h, s) => (s ? h * 0.5 : w - h / 2 - 12)) as Span] as const
  ),
]);

const size = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

// Mermaid draws a subgraph title at the top of its box, `subGraphTitleMargin.top` below the
// border, so the band above the content holds both margins, the title and a gap.
function toLayoutGroup(n: Node, data: LayoutData, groupIds: Set<string>): LayoutGroup {
  const margin = data.config?.flowchart?.subGraphTitleMargin;
  const titleWidth = size(n.labelBBox?.width);
  const titleHeight = size(n.labelBBox?.height);
  const titled = titleWidth > 0 && titleHeight > 0;
  const group: LayoutGroup = {
    id: n.id,
    padding: {
      top: titled ? size(margin?.top) + size(margin?.bottom) + TITLE_GAP : GROUP_PAD,
      right: GROUP_PAD,
      bottom: GROUP_PAD,
      left: GROUP_PAD,
    },
  };
  if (n.parentId && groupIds.has(n.parentId)) {
    group.parent = n.parentId;
  }
  const dir = n.dir ? DIRS[String(n.dir).toUpperCase()] : undefined;
  if (dir) {
    group.direction = dir;
  }
  if (titled) {
    group.title = { width: titleWidth, height: titleHeight };
  }
  return group;
}

function hasLabel(edge: Edge): boolean {
  return typeof edge.label === 'string' ? edge.label.trim().length > 0 : Boolean(edge.label);
}

/** The engine's input for a measured `LayoutData`: nodes, subgraphs (as groups) and edges. */
export function toLayoutGraph(data: LayoutData): LayoutGraph {
  const dir = direction(data);
  const { spacing } = layoutSettings({
    nodeSpacing: size(data.nodeSpacing) || undefined,
    rankSpacing: size(data.rankSpacing) || undefined,
  });
  const groupIds = new Set(data.nodes.filter((n) => n.isGroup).map((n) => n.id));
  const groups = data.nodes.filter((n) => n.isGroup).map((n) => toLayoutGroup(n, data, groupIds));
  const nodes: LayoutNode[] = [];
  const ids = new Set<string>(groupIds);
  for (const n of data.nodes) {
    if (n.isGroup) {
      continue;
    }
    ids.add(n.id);
    const width = size(n.width);
    const height = size(n.height);
    const node: LayoutNode = { id: n.id, width, height };
    if (n.parentId && groupIds.has(n.parentId)) {
      node.parent = n.parentId;
    }
    const span = n.shape ? SPANS.get(n.shape) : undefined;
    if (span) {
      node.span = Math.max(0, span(width, height, sideways(dir)));
    }
    nodes.push(node);
  }
  const edges: LayoutEdge[] = [];
  for (const e of data.edges) {
    if (e.isLayoutOnly || !e.start || !e.end || !ids.has(e.start) || !ids.has(e.end)) {
      continue;
    }
    const edge: LayoutEdge = {
      id: e.id,
      source: e.start,
      target: e.end,
      minLen: Math.max(1, Math.round(size(e.minlen) || 1)),
    };
    const lw = size(e.width);
    if (hasLabel(e) && lw > 0) {
      edge.label = { width: lw + LABEL_W, height: size(e.height) + LABEL_H };
    }
    edges.push(edge);
  }
  // mermaid adds the diagram padding itself when it sets up the viewport.
  return {
    direction: dir,
    nodes,
    edges,
    groups,
    spacing,
    diagramPadding: 0,
    headRoom: HEAD_ROOM,
  };
}

/** Writes the engine's positions, routes and label centres back onto `LayoutData`. */
export function applyLayoutModel(data: LayoutData, model: LayoutModel): void {
  for (const n of data.nodes) {
    const placed = model.nodes.get(n.id);
    if (placed) {
      n.x = placed.x;
      n.y = placed.y;
      continue;
    }
    // Clusters are sized by the engine; `insertCluster` draws them centred on `x`, `y`.
    const cluster = n.isGroup ? model.groups.get(n.id) : undefined;
    if (cluster) {
      n.x = cluster.x;
      n.y = cluster.y;
      n.width = cluster.width;
      n.height = cluster.height;
    }
  }
  for (const e of data.edges) {
    const routed = model.edges.get(e.id);
    if (!routed) {
      continue;
    }
    e.points = routed.points.map((p) => ({ x: p.x, y: p.y, axis: p.axis }));
    if (routed.label) {
      e.x = routed.label.x;
      e.y = routed.label.y;
    }
  }
}

type Outline = Node & { intersect: NonNullable<Node['intersect']> };

const hasOutline = (n: Node | undefined): n is Outline =>
  n !== undefined &&
  !n.isGroup &&
  typeof n.intersect === 'function' &&
  Number.isFinite(n.x) &&
  Number.isFinite(n.y);

// Whether `p` lies inside the shape, asking the shape's own `intersect` where its outline is on
// the ray from the centre through `p`. Mermaid's shapes are all star-shaped about their centre.
function inside(n: Outline, p: { x: number; y: number }): boolean {
  const d = Math.hypot(p.x - n.x!, p.y - n.y!);
  if (d < 1e-6) {
    return true;
  }
  const o = n.intersect(p);
  const r = Math.hypot(o.x - n.x!, o.y - n.y!);
  return Number.isFinite(r) && d <= r + 1e-6;
}

// Moves a route end from the node's box onto its outline, square to the box side it sits on
// (as v13's `inset` does), so the end keeps its side and its place along that side.
function onOutline(n: Outline, end: RoutePoint): RoutePoint {
  const onTopOrBottom = Math.abs(Math.abs(end.y - n.y!) - size(n.height) / 2) < 0.5;
  const onLeftOrRight = Math.abs(Math.abs(end.x - n.x!) - size(n.width) / 2) < 0.5;
  if ((!onTopOrBottom && !onLeftOrRight) || inside(n, end)) {
    return end;
  }
  // Towards the centre line, from the box side.
  const to = onTopOrBottom ? { x: end.x, y: n.y! } : { x: n.x!, y: end.y };
  if (!inside(n, to)) {
    // The port lies outside the shape altogether: meet the outline on the way to the centre.
    const o = n.intersect(end);
    return Number.isFinite(o.x) && Number.isFinite(o.y) ? { ...end, x: o.x, y: o.y } : end;
  }
  let outside = 0;
  let within = 1;
  for (let i = 0; i < 40; i++) {
    const t = (outside + within) / 2;
    const p = { x: end.x + (to.x - end.x) * t, y: end.y + (to.y - end.y) * t };
    if (inside(n, p)) {
      within = t;
    } else {
      outside = t;
    }
  }
  return {
    ...end,
    x: end.x + (to.x - end.x) * within,
    y: end.y + (to.y - end.y) * within,
  };
}

/**
 * Moves each axis-tagged route's ends from the bounding box onto the shape outline, using the
 * `intersect` the shape installed when it was drawn. Nodes without one (headless runs) keep the
 * box ends.
 */
export function clipRouteEnds(data: LayoutData): void {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  for (const e of data.edges) {
    const points = e.points as RoutePoint[] | undefined;
    if (!points || points.length < 2 || points.some((p) => p.axis === undefined)) {
      continue;
    }
    const src = byId.get(e.start ?? '');
    const dst = byId.get(e.end ?? '');
    const next = [...points];
    if (hasOutline(src)) {
      next[0] = onOutline(src, next[0]);
    }
    if (hasOutline(dst)) {
      next[next.length - 1] = onOutline(dst, next[next.length - 1]);
    }
    e.points = next;
  }
}

/**
 * The layout core shared by the browser renderer and headless tests: translate, run the
 * engine, write back, and put route ends on the shapes.
 */
export function runLayeredLayoutCore(data: LayoutData): LayoutModel {
  const model = layered(toLayoutGraph(data));
  applyLayoutModel(data, model);
  clipRouteEnds(data);
  return model;
}
