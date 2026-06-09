import type { LayoutData, Node } from '../../types.js';
import type { OrthogonalOptions } from './types.js';
import { rectForNode } from './core/helpers.js';
import { log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';
import { isEdgeLabelNode } from './core/labels.js';

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
  groupPadding: number
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
  minY -= groupPadding;
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

function isPointInsideRect(
  p: { x: number; y: number },
  r: ReturnType<typeof rectForNode>
): boolean {
  return p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom;
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

  // Pass 2: if a node is geometrically inside a group it doesn't belong to, push it out.
  const groups = [...groupsById.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));
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

      const r = rectForNode(group);
      if (!isPointInsideRect({ x: node.x, y: node.y }, r)) {
        continue;
      }

      const leftDist = node.x - r.left;
      const rightDist = r.right - node.x;
      const topDist = node.y - r.top;
      const bottomDist = r.bottom - node.y;

      const min = Math.min(leftDist, rightDist, topDist, bottomDist);
      const nodeHalfW = (node.width ?? 40) / 2;
      const nodeHalfH = (node.height ?? 40) / 2;
      const offset = 60;

      if (min === leftDist) {
        node.x = r.left - nodeHalfW - offset;
      } else if (min === rightDist) {
        node.x = r.right + nodeHalfW + offset;
      } else if (min === topDist) {
        node.y = r.top - nodeHalfH - offset;
      } else {
        node.y = r.bottom + nodeHalfH + offset;
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
    const bounds = calculateGroupBounds(group, children, groupPadding);
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
    const bounds = calculateGroupBounds(group, children, groupPadding);
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
