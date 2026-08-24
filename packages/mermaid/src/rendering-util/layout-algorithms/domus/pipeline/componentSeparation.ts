/**
 * Separate the drawings of disconnected components before routing.
 *
 * DOMUS assigns a shape to the whole vertex set in one SAT instance. A shape
 * constrains the *relative* direction of adjacent vertices, so two vertices in
 * different connected components share no clause: nothing in the formula — and
 * nothing in the coordinate assignment that reads it — has an opinion about
 * where one component sits relative to another. On a diagram that is really
 * several graphs authored in one file, the components are therefore free to
 * land on top of each other, and they do.
 *
 * `domus/triage` is three graphs. Measured before this pass, component B's
 * bounding box sat entirely inside component A's, with the third (a single
 * isolated node) inside both. No node actually overlapped — the overlap sweep
 * had already seen to that — but A's edges had to cross B's territory
 * to get anywhere, and every remaining validation issue on the fixture was a
 * consequence: obstacle intersections against foreign-component nodes, parallel
 * segments 2.6px apart, a shared subpath, and border hugging.
 *
 * Paper background. Connectivity is a stated *precondition* of this pipeline,
 * not an accident: DOMUS declares "Unless otherwise specified, graphs are
 * connected" (LIPIcs.GD.2025.35 §2) and its own benchmark generator rejects
 * disconnected instances outright (§5), so the paper defines no behaviour for
 * this input at all. The mechanism is visible in §3: the auxiliary digraphs
 * Gx/Gy take their arcs exclusively from labelled *edges*, and coordinates are
 * assigned by "increasing coordinates according to the directed arcs" — with
 * no edge between two components there is no arc, hence no ordering, hence
 * nothing to separate them. The corpus's answer is unanimous and old: "If the
 * input graph is not connected, then we draw each connected component
 * separately" and later "combine the drawings of connected components"
 * (Biedl-Madden-Tollis §3.1/§3.5); dot says the same (Gansner et al. §1.2).
 *
 * So: draw each component independently, then pack the drawings. Here the
 * components are already drawn — one SAT run produced all of them, and because
 * no clause spans two components that run is equivalent to solving each
 * separately and overlaying the results at a shared origin — so packing is a
 * rigid translation per component. That is the property that makes this safe:
 * translating a whole component preserves every distance and direction inside
 * it, so the DOMUS shape stays satisfied, Gx/Gy equivalence classes stay
 * aligned, and no intra-component quality is spent to buy the separation.
 *
 * The alternative the corpus also records — adding dummy edges to connect the
 * components before planarization (Siebenhaller §3.3.2 step 1(d), removed again
 * at step 5(a)) — is deliberately not taken. In a flow-based pipeline a dummy
 * edge perturbs a network and is deleted; in a shape-first one it acquires
 * L/R/D/U variables, consumes a direction at each endpoint, joins every
 * selected cycle through it, and if the solver's UNSAT proof fingers it, gets
 * subdivided — which is to say it can add bends to *real* edges. Bends are the
 * metric DOMUS exists to win.
 *
 * WHERE this runs matters, for the same reason `separateOverlapsBySweep`
 * documents: at the end of coordinate assignment, before any edge is routed.
 * Run after routing it would strand every polyline it moves an endpoint of.
 *
 * The pass is a no-op — returning before it measures anything expensive — when
 * the graph is connected, which is the overwhelming majority of fixtures.
 */
import type { LayoutData, Node } from '../../../types.js';

export interface ComponentSeparationResult {
  /** Number of connected components found (1 means the pass did nothing). */
  components: number;
  /** Nodes actually translated. */
  moved: number;
  /** True when geometry changed. */
  changed: boolean;
}

const NO_CHANGE: ComponentSeparationResult = { components: 1, moved: 0, changed: false };

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function isPlaceable(node: Node | undefined): boolean {
  return (
    node?.id != null &&
    Number.isFinite(Number((node as { x?: unknown }).x)) &&
    Number.isFinite(Number((node as { y?: unknown }).y)) &&
    Number.isFinite(Number(node.width)) &&
    Number.isFinite(Number(node.height))
  );
}

function boxOf(node: Node): Box {
  const cx = Number((node as { x?: number }).x ?? 0);
  const cy = Number((node as { y?: number }).y ?? 0);
  const hw = Number(node.width ?? 0) / 2;
  const hh = Number(node.height ?? 0) / 2;
  return { x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh };
}

function union(a: Box, b: Box): Box {
  return {
    x0: Math.min(a.x0, b.x0),
    y0: Math.min(a.y0, b.y0),
    x1: Math.max(a.x1, b.x1),
    y1: Math.max(a.y1, b.y1),
  };
}

/** True when the two boxes come within `gap` of each other on both axes. */
function boxesInterfere(a: Box, b: Box, gap: number): boolean {
  return a.x0 - gap < b.x1 && b.x0 - gap < a.x1 && a.y0 - gap < b.y1 && b.y0 - gap < a.y1;
}

class DisjointSet {
  private readonly parent = new Map<string, string>();

  add(id: string): void {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
    }
  }

  find(id: string): string {
    let root = id;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root) ?? root;
    }
    // Path compression.
    let cur = id;
    while (this.parent.get(cur) !== root) {
      const next = this.parent.get(cur) ?? root;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  join(a: string, b: string): void {
    if (!this.parent.has(a) || !this.parent.has(b)) {
      return;
    }
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) {
      this.parent.set(ra, rb);
    }
  }
}

/**
 * Shelf-pack component boxes left-to-right into rows.
 *
 * Two choices here are taken from the literature rather than invented:
 *
 * - **Order: descending bounding-box perimeter.** HOLA's greedy sub-drawing
 *   placement considers sub-drawings "in descending order of the perimeter of
 *   their bounding box" (Kieffer et al., HOLA, §4.3). Perimeter, not vertex
 *   count — which matters for Mermaid, where label sizes vary enough that node
 *   count is a poor proxy for drawn area.
 * - **Target: a square.** Aspect ratio is `max(w,h)/min(w,h)`, "lower aspect
 *   ratios better and squares (with aspect ratio 1) optimal" (Zink et al.,
 *   §Metrics); PRALINE scores the ratio "closest to 1" the winner. So the shelf
 *   width targets `sqrt(totalArea)` rather than a deliberately landscape strip.
 *
 * The corpus has no packing algorithm of its own — it states only *that*
 * components are drawn separately and their drawings combined, never how
 * (Biedl-Madden-Tollis §3.5; Gansner et al. §1.2). Shelf packing is therefore
 * this pass's own choice, and it is the same strip-packing shape
 * `compoundPlacement.ts` already uses for per-level component boxes.
 */
function shelfPack(
  sizes: { width: number; height: number }[],
  gap: number
): { offsets: { x: number; y: number }[]; width: number; height: number } {
  const totalArea = sizes.reduce((acc, s) => acc + s.width * s.height, 0);
  const widest = sizes.reduce((acc, s) => Math.max(acc, s.width), 0);
  const targetWidth = Math.max(widest, Math.sqrt(totalArea));

  const perimeter = (s: { width: number; height: number }) => 2 * (s.width + s.height);
  const offsets: { x: number; y: number }[] = new Array(sizes.length);
  const order = sizes
    .map((s, i) => ({ s, i }))
    .sort((a, b) => perimeter(b.s) - perimeter(a.s) || a.i - b.i);

  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let maxRight = 0;
  for (const { s, i } of order) {
    if (x > 0 && x + s.width > targetWidth) {
      x = 0;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    offsets[i] = { x, y };
    rowHeight = Math.max(rowHeight, s.height);
    maxRight = Math.max(maxRight, x + s.width);
    x += s.width + gap;
  }
  return { offsets, width: Math.max(1, maxRight), height: Math.max(1, y + rowHeight) };
}

/**
 * Pack the drawings of disconnected components so their bounding boxes are
 * pairwise disjoint. Mutates node positions in place; returns what it did.
 */
export function separateDisconnectedComponents(
  layout: LayoutData,
  opts: { gap?: number } = {}
): ComponentSeparationResult {
  const gap = Math.max(1, opts.gap ?? 40);
  const placeable = (layout.nodes ?? []).filter((n) => isPlaceable(n));
  if (placeable.length < 2) {
    return NO_CHANGE;
  }

  const known = new Set(placeable.map((n) => String(n.id)));
  const ds = new DisjointSet();
  for (const id of known) {
    ds.add(id);
  }

  // Edges connect components. Edge-label dummies are spliced into the edge
  // chain (`injectEdgeLabelNodes.ts`), so they join the right component through
  // their own two edges — they need no special case here.
  for (const edge of layout.edges ?? []) {
    const from = (edge as { start?: string }).start ?? '';
    const to = (edge as { end?: string }).end ?? '';
    if (known.has(from) && known.has(to)) {
      ds.join(from, to);
    }
  }

  // A group and everything under it is one rigid body: splitting a group across
  // two packed cells would tear its frame apart. Joining each node to its
  // parent also transitively joins the group's members to each other, so a
  // group whose members are otherwise edge-less still travels as a unit.
  for (const node of placeable) {
    const parent = (node as { parentId?: string }).parentId;
    if (parent != null && known.has(parent)) {
      ds.join(String(node.id), parent);
    }
  }

  const members = new Map<string, Node[]>();
  for (const node of placeable) {
    const root = ds.find(String(node.id));
    const list = members.get(root);
    if (list) {
      list.push(node);
    } else {
      members.set(root, [node]);
    }
  }
  if (members.size < 2) {
    return NO_CHANGE;
  }

  const comps = [...members.values()].map((nodes) => {
    let box = boxOf(nodes[0]);
    for (let i = 1; i < nodes.length; i++) {
      box = union(box, boxOf(nodes[i]));
    }
    return { nodes, box };
  });

  // Cheap exit: if the drawings are already clear of each other, DOMUS's own
  // arrangement is fine and moving it would only churn.
  let interference = false;
  for (let i = 0; i < comps.length && !interference; i++) {
    for (let j = i + 1; j < comps.length; j++) {
      if (boxesInterfere(comps[i].box, comps[j].box, gap)) {
        interference = true;
        break;
      }
    }
  }
  if (!interference) {
    return { components: comps.length, moved: 0, changed: false };
  }

  const sizes = comps.map((c) => ({
    width: Math.max(1, c.box.x1 - c.box.x0),
    height: Math.max(1, c.box.y1 - c.box.y0),
  }));
  const { offsets } = shelfPack(sizes, gap);

  // Anchor the packed arrangement at the original overall top-left so the
  // drawing does not jump in the coordinate space downstream passes share.
  let overall = comps[0].box;
  for (let i = 1; i < comps.length; i++) {
    overall = union(overall, comps[i].box);
  }

  let moved = 0;
  for (const [i, comp] of comps.entries()) {
    const dx = overall.x0 + offsets[i].x - comp.box.x0;
    const dy = overall.y0 + offsets[i].y - comp.box.y0;
    if (dx === 0 && dy === 0) {
      continue;
    }
    for (const node of comp.nodes) {
      const n = node as { x?: number; y?: number };
      n.x = Number(n.x ?? 0) + dx;
      n.y = Number(n.y ?? 0) + dy;
      moved++;
    }
  }

  return { components: comps.length, moved, changed: moved > 0 };
}
