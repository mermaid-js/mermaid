import type { LayoutData, Node } from '../../types.js';
import type { OrthogonalOptions } from './types.js';
import { rectForNode } from './core/helpers.js';
import { log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';
import { isEdgeLabelNode } from './core/labels.js';
import { getConfig } from '../../../config.js';
import { getSubGraphTitleMargins } from '../../../utils/subGraphTitleMargins.js';

/**
 * Height reserved at the top of a titled subgraph frame for its title band.
 *
 * `clusters.js` paints the title inside the frame at `top + subGraphTitleTopMargin`,
 * so the topmost child must sit *below* that band or the title overlaps it (e.g.
 * `domus/decoupled-subgraph`: node "D" under the "hello" title). Reserving the band
 * here — while the group is framed, before routing and overlap resolution — is what
 * makes the layout title-aware: the router sees the true top edge and draws
 * subgraph→external edges from it, and the frame's real extent participates in
 * spacing. (The previous fix grew the frame in paint only, after routing, so the
 * edge start ended up buried inside the grown box.) The DOM-free layout never
 * measures the title, so the height is estimated from the flowchart font size
 * (one rendered line ≈ 1.5 × fontSize), matching the browser's single-line title.
 */
function titleBandHeight(): number {
  const siteConfig = getConfig();
  const { subGraphTitleTotalMargin } = getSubGraphTitleMargins({
    flowchart: siteConfig.flowchart ?? {},
  });
  const titleFontSize = Number((siteConfig as { fontSize?: unknown }).fontSize) || 16;
  return Math.round(titleFontSize * 1.5) + subGraphTitleTotalMargin;
}

/**
 * Per-layout memo of `titleBandHeight()`.
 *
 * `getConfig()` is `assignWithDepth({}, currentConfig)` — a full recursive clone
 * of the Mermaid config — and the band height is read once per titled group per
 * `validateLayout()` call. The score-gated passes validate thousands of edge
 * candidates per render, so on `domus/mermaid-chart-architecture` (13 groups)
 * this one constant cost 1259 ms of a 13.5 s render: 9% of the whole layout
 * spent deep-cloning the config to read a font size. The band cannot change
 * while a layout object is being laid out — no pass rewrites the site config
 * mid-render — and each render parses a fresh `LayoutData`, so keying the memo
 * on the layout object is both safe and self-invalidating.
 */
const titleBandByLayout = new WeakMap<object, number>();

function titleBandHeightForLayout(layout: object): number {
  const cached = titleBandByLayout.get(layout);
  if (cached !== undefined) {
    return cached;
  }
  const band = titleBandHeight();
  titleBandByLayout.set(layout, band);
  return band;
}

/** Gap we want to keep between the title band and the topmost child. */
const TITLE_CHILD_GAP = 15;

/**
 * Extra top inset a specific group needs *beyond* its ordinary padding to host
 * the title band. `calculateGroupBounds` already insets the top by `groupPadding`,
 * so a titled group only needs enough more to reach `titleBand + TITLE_CHILD_GAP`
 * of clear space above its topmost child. When `groupPadding` already exceeds
 * that (e.g. the compound path's 40px routing margin), no extra is reserved — the
 * title fits in the padding — which keeps title-band reservation from inflating
 * deeply nested compound frames. Untitled groups reserve nothing.
 */
function groupTitleBand(group: Node, titleBand: number, groupPadding: number): number {
  if (!hasTitle(group) || titleBand <= 0) {
    return 0;
  }
  return Math.max(0, titleBand + TITLE_CHILD_GAP - groupPadding);
}

/** Whether a group carries a non-empty title label. */
export function hasTitle(group: Node): boolean {
  const label = (group as { label?: unknown }).label;
  return typeof label === 'string' && label.trim() !== '';
}

/**
 * The title-band rectangle a titled group reserves at the top of its final frame:
 * the top `titleBandHeight()` strip, full frame width. Returns `null` for untitled
 * groups or before the group has geometry. The validator's node-overlap check reads
 * this to score title-over-child overlaps; it is intentionally NOT stored as
 * `node.groupTitleRect` (that also arms the core edge-title check, which conflicts
 * with subgraph→external edges that must legitimately exit through the top strip).
 */
export function subgraphTitleBandRect(
  group: Node,
  /** Pass the owning layout to reuse the memoized band height (see `titleBandHeightForLayout`). */
  layout?: object
): { left: number; right: number; top: number; bottom: number } | null {
  if (!group.isGroup || !hasTitle(group)) {
    return null;
  }
  const band = layout ? titleBandHeightForLayout(layout) : titleBandHeight();
  if (band <= 0 || typeof group.x !== 'number' || typeof group.y !== 'number') {
    return null;
  }
  const left = group.x - (group.width ?? 0) / 2;
  const right = group.x + (group.width ?? 0) / 2;
  const top = group.y - (group.height ?? 0) / 2;
  return { left, right, top, bottom: top + band };
}

export interface ClusterPreprocessResult {
  nodesById: Map<string, Node>;
  groupsById: Map<string, Node>;
  childrenByParentId: Map<string, Node[]>;
}

function sortGroupNodesToEnd(nodes: Node[]): Node[] {
  const nonGroupNodes = nodes.filter((n) => !n.isGroup);
  const groupNodes = nodes
    .filter((n) => n.isGroup)
    .sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0));
  return [...nonGroupNodes, ...groupNodes];
}

function buildClusterIndex(data: LayoutData): ClusterPreprocessResult {
  const nodesById = new Map<string, Node>();
  const groupsById = new Map<string, Node>();
  const childrenByParentId = new Map<string, Node[]>();

  for (const node of data.nodes ?? []) {
    if (node?.id == null) {
      continue;
    }
    const id = String(node.id);
    nodesById.set(id, node);
    if (node.isGroup) {
      groupsById.set(id, node);
    }
  }

  for (const node of data.nodes ?? []) {
    if (node?.id == null) {
      continue;
    }
    const pid = node.parentId != null ? String(node.parentId) : null;
    if (!pid) {
      continue;
    }
    // Edge label nodes (edge-label-*) are routing/annotation helpers and should not
    // affect cluster bounds or containment checks.
    if (isEdgeLabelNode(node)) {
      continue;
    }
    const arr = childrenByParentId.get(pid) ?? [];
    arr.push(node);
    childrenByParentId.set(pid, arr);
  }

  // Deterministic ordering of children (helps determinism of bounds when equal).
  for (const [pid, arr] of childrenByParentId) {
    arr.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    childrenByParentId.set(pid, arr);
  }

  return { nodesById, groupsById, childrenByParentId };
}

function groupDepth(groupId: string, nodesById: Map<string, Node>): number {
  let d = 0;
  let cur: Node | undefined = nodesById.get(groupId);
  // Only count group->group parent links for depth ordering.
  while (cur?.parentId != null) {
    const p = nodesById.get(String(cur.parentId));
    if (!p?.isGroup) {
      break;
    }
    d++;
    cur = p;
  }
  return d;
}

function calculateGroupBounds(
  group: Node,
  children: Node[],
  groupPadding: number,
  topBand = 0
): { cx: number; cy: number; width: number; height: number } | null {
  if (!children || children.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const child of children) {
    // Children should already have x/y/width/height.
    const r = rectForNode(child);
    minX = Math.min(minX, r.left);
    minY = Math.min(minY, r.top);
    maxX = Math.max(maxX, r.right);
    maxY = Math.max(maxY, r.bottom);
  }

  minX -= groupPadding;
  // Reserve the title band on top of the ordinary padding for titled groups so
  // the topmost child clears the painted title (see `titleBandHeight`).
  minY -= groupPadding + topBand;
  maxX += groupPadding;
  maxY += groupPadding;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const width = maxX - minX;
  const height = maxY - minY;

  // Avoid 0-sized groups (defensive).
  return {
    cx,
    cy,
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}

function nodeLayer(node: Node): number {
  return typeof (node as any).layer === 'number' ? Number((node as any).layer) : 0;
}

function setNodeLayer(node: Node, layer: number): void {
  (node as any).layer = layer;
}

function overlapsRects(
  a: ReturnType<typeof rectForNode>,
  b: ReturnType<typeof rectForNode>
): boolean {
  const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return overlapX > 0 && overlapY > 0;
}

function belongsToGroup(node: Node, groupId: string, nodesById: Map<string, Node>): boolean {
  let cur: Node | undefined = node;
  const seen = new Set<string>();
  while (cur?.parentId != null) {
    const pid = String(cur.parentId);
    if (seen.has(pid)) {
      break;
    }
    seen.add(pid);
    if (pid === groupId) {
      return true;
    }
    const p = nodesById.get(pid);
    if (!p?.isGroup) {
      break;
    }
    cur = p;
  }
  return false;
}

function displaceGroup(
  group: Node,
  displacement: { x: number; y: number },
  nodesById: Map<string, Node>,
  childrenByParentId: Map<string, Node[]>
): void {
  group.x = (group.x ?? 0) + displacement.x;
  group.y = (group.y ?? 0) + displacement.y;

  const moveChildren = (parentId: string) => {
    const children = childrenByParentId.get(parentId) ?? [];
    for (const child of children) {
      child.x = (child.x ?? 0) + displacement.x;
      child.y = (child.y ?? 0) + displacement.y;
      if (child.isGroup) {
        moveChildren(String(child.id));
      }
    }
  };
  moveChildren(String(group.id));
}

function resolveGroupOverlaps(
  groupsById: Map<string, Node>,
  nodesById: Map<string, Node>,
  childrenByParentId: Map<string, Node[]>,
  minGroupSpacing: number
): void {
  const groups = [...groupsById.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  if (groups.length < 2) {
    return;
  }

  // Only consider sibling groups (same parentId) as per cluster-logic.md.
  const siblingsKey = (g: Node) => (g.parentId != null ? String(g.parentId) : '__ROOT__');

  const MAX_ITERS = 50;
  for (let iter = 0; iter < MAX_ITERS; iter++) {
    let moved = false;

    for (let i = 0; i < groups.length; i++) {
      const g1 = groups[i];
      for (let j = i + 1; j < groups.length; j++) {
        const g2 = groups[j];
        if (siblingsKey(g1) !== siblingsKey(g2)) {
          continue;
        }

        const r1 = rectForNode(g1);
        const r2 = rectForNode(g2);
        if (!overlapsRects(r1, r2)) {
          continue;
        }

        const sameLayer = nodeLayer(g1) === nodeLayer(g2);

        const overlapX = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
        const overlapY = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);

        if (sameLayer) {
          const total = overlapX + minGroupSpacing;
          const half = total / 2;
          const dir = r1.cx < r2.cx || (r1.cx === r2.cx && String(g1.id) < String(g2.id)) ? -1 : 1;
          displaceGroup(g1, { x: dir * half, y: 0 }, nodesById, childrenByParentId);
          displaceGroup(g2, { x: -dir * half, y: 0 }, nodesById, childrenByParentId);
        } else {
          const total = overlapY + minGroupSpacing;
          const half = total / 2;
          const dir = r1.cy < r2.cy || (r1.cy === r2.cy && String(g1.id) < String(g2.id)) ? -1 : 1;
          displaceGroup(g1, { x: 0, y: dir * half }, nodesById, childrenByParentId);
          displaceGroup(g2, { x: 0, y: -dir * half }, nodesById, childrenByParentId);
        }

        moved = true;
      }
    }

    if (!moved) {
      break;
    }
  }
}

function checkAllChildrenInGroup(
  data: LayoutData,
  nodesById: Map<string, Node>,
  groupsById: Map<string, Node>
): void {
  const nodes = data.nodes ?? [];
  const groupIds = new Set([...groupsById.keys()]);

  // Pass 1: clean invalid parent references.
  for (const node of nodes) {
    if (!node.parentId) {
      continue;
    }
    const pid = String(node.parentId);
    if (!groupIds.has(pid)) {
      node.parentId = undefined;
    }
  }

  // Pass 2: if a node's rectangle overlaps a group frame it doesn't belong to,
  // push it fully out of that frame. Rect-based (not centre-based): a foreign
  // node crossing any edge — top, bottom, left, or right — reads as "inside the
  // box" and must be separated, even when its centre is outside the frame
  // (e.g. deploy-pipeline's "Notify Developer" crossing the frame's right edge).
  // Displacement is the minimal penetration on the shallowest axis plus a
  // clearance, so the node clears both this hard overlap and the soft
  // node-too-close-to-group threshold.
  const groups = [...groupsById.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const CLEARANCE = 20;
  for (const node of nodes) {
    if (node.isGroup) {
      continue;
    }
    // Edge label nodes (edge-label-*) are routing/annotation helpers; do not
    // displace them during containment validation.
    if (isEdgeLabelNode(node)) {
      continue;
    }
    if (typeof node.x !== 'number' || typeof node.y !== 'number') {
      continue;
    }

    for (const group of groups) {
      const gid = String(group.id);
      if (belongsToGroup(node, gid, nodesById)) {
        continue;
      }

      const gr = rectForNode(group);
      const r = rectForNode(node);
      const overlapX = Math.min(r.right, gr.right) - Math.max(r.left, gr.left);
      const overlapY = Math.min(r.bottom, gr.bottom) - Math.max(r.top, gr.top);
      if (overlapX <= 0 || overlapY <= 0) {
        continue;
      }

      // Minimal displacement to move the node's rect clear of the frame on each
      // side, plus clearance. Smallest wins; ties break left→right→up→down.
      const pushLeft = r.right - gr.left + CLEARANCE;
      const pushRight = gr.right - r.left + CLEARANCE;
      const pushUp = r.bottom - gr.top + CLEARANCE;
      const pushDown = gr.bottom - r.top + CLEARANCE;
      const minPush = Math.min(pushLeft, pushRight, pushUp, pushDown);

      if (minPush === pushLeft) {
        node.x -= pushLeft;
      } else if (minPush === pushRight) {
        node.x += pushRight;
      } else if (minPush === pushUp) {
        node.y -= pushUp;
      } else {
        node.y += pushDown;
      }
    }
  }
}

function assignGroupLayers(
  data: LayoutData,
  nodesById: Map<string, Node>,
  groupsById: Map<string, Node>
): void {
  // Minimal cluster layer semantics (cluster-logic.md §5):
  // - Groups should have a stable layer so overlap resolution can apply same-layer rules.
  // - Children must have layer >= parent layer.
  //
  // Mermaid orthogonal node layout assigns `layer` to non-group nodes; groups often lack it.
  // We infer each group's layer as (min child layer) by default (stable, contains children),
  // then enforce child >= parent by bumping children up if needed.
  const groupIds = [...groupsById.keys()].sort((a, b) => a.localeCompare(b));

  // Bottom-up: deeper groups first so parents can look at child group layers too.
  const ordered = groupIds.sort((a, b) => {
    const da = groupDepth(a, nodesById);
    const db = groupDepth(b, nodesById);
    if (da !== db) {
      return db - da;
    }
    return a.localeCompare(b);
  });

  for (const gid of ordered) {
    const g = nodesById.get(gid);
    if (!g?.isGroup) {
      continue;
    }
    const children = (data.nodes ?? []).filter(
      (n) => n.parentId != null && String(n.parentId) === gid
    );
    const childLayers = children.map((c) => nodeLayer(c)).filter((l) => Number.isFinite(l));
    if (childLayers.length > 0) {
      setNodeLayer(g, Math.min(...childLayers));
    } else if (typeof (g as any).layer !== 'number') {
      setNodeLayer(g, 0);
    }
  }

  // Enforce child layer >= parent layer (top-down).
  // Iterate a few times to handle nested groups deterministically.
  for (let iter = 0; iter < 5; iter++) {
    let changed = false;
    for (const gid of groupIds) {
      const g = nodesById.get(gid);
      if (!g?.isGroup) {
        continue;
      }
      const gl = nodeLayer(g);
      for (const n of data.nodes ?? []) {
        if (n.parentId != null && String(n.parentId) === gid) {
          const nl = nodeLayer(n);
          if (nl < gl) {
            setNodeLayer(n, gl);
            changed = true;
          }
        }
      }
    }
    if (!changed) {
      break;
    }
  }
}

/**
 * Cluster pre-pass:
 * - Build parent/child hierarchy from Node.parentId
 * - Bottom-up compute group bounds to enclose children with padding
 * - Sort groups to the end for rendering order (largest first)
 *
 * This is a minimal subset of cluster-logic.md needed for edge routing to treat
 * group nodes as meaningful rectangles.
 */
export function preprocessClusters(
  data: LayoutData,
  options: OrthogonalOptions = {}
): ClusterPreprocessResult {
  log.debug(ORTHO_DEBUG, 'CLUSTER_PREPROCESS_ENTER', {
    nodes: (data.nodes ?? []).length,
    edges: (data.edges ?? []).length,
    groupPadding: options.groupPadding ?? 15,
    minGroupSpacing: options.minGroupSpacing ?? 100,
  });
  const groupPadding = options.groupPadding ?? 15;
  const minGroupSpacing = options.minGroupSpacing ?? 100;
  const titleBand = titleBandHeight();
  const { nodesById, groupsById, childrenByParentId } = buildClusterIndex(data);

  if (groupsById.size === 0) {
    return { nodesById, groupsById, childrenByParentId };
  }

  // Bottom-up: process deeper groups first.
  const groupIds = [...groupsById.keys()].sort((a, b) => {
    const da = groupDepth(a, nodesById);
    const db = groupDepth(b, nodesById);
    if (da !== db) {
      return db - da;
    }
    return a.localeCompare(b);
  });

  for (const gid of groupIds) {
    const group = nodesById.get(gid);
    if (!group?.isGroup) {
      continue;
    }
    const children = childrenByParentId.get(gid) ?? [];
    const bounds = calculateGroupBounds(
      group,
      children,
      groupPadding,
      groupTitleBand(group, titleBand, groupPadding)
    );
    if (!bounds) {
      continue;
    }
    group.x = bounds.cx;
    group.y = bounds.cy;
    group.width = bounds.width;
    group.height = bounds.height;
  }

  // Ensure groups have stable layer values before overlap resolution (same-layer rule).
  assignGroupLayers(data, nodesById, groupsById);

  // Resolve overlaps between sibling groups by displacing whole subtrees.
  resolveGroupOverlaps(groupsById, nodesById, childrenByParentId, minGroupSpacing);

  // Containment validation: move misplaced nodes outside group boundaries.
  checkAllChildrenInGroup(data, nodesById, groupsById);

  // Final bounds pass (after potential displacement/containment changes).
  for (const gid of groupIds) {
    const group = nodesById.get(gid);
    if (!group?.isGroup) {
      continue;
    }
    const children = childrenByParentId.get(gid) ?? [];
    const bounds = calculateGroupBounds(
      group,
      children,
      groupPadding,
      groupTitleBand(group, titleBand, groupPadding)
    );
    if (!bounds) {
      continue;
    }
    group.x = bounds.cx;
    group.y = bounds.cy;
    group.width = bounds.width;
    group.height = bounds.height;
  }

  // Rendering order: groups last (largest first).
  data.nodes = sortGroupNodesToEnd(data.nodes ?? []);

  if (options.debug) {
    log.info(ORTHO_DEBUG, 'cluster_preprocess', JSON.stringify({ groups: [...groupsById.keys()] }));
  }

  return { nodesById, groupsById, childrenByParentId };
}
