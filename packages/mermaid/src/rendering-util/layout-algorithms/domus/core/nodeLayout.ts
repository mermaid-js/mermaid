/**
 * Node positioning stage for the orthogonal layout.
 *
 * This module handles the topology/shape step that:
 * - Assigns each node to a discrete layer based on undirected graph distance
 * - Positions nodes in each layer horizontally using their measured widths
 * - Spaces layers vertically using their measured heights
 *
 * The implementation is intentionally simple (BFS layering on the undirected
 * graph) but respects the core invariants: fixed, non-overlapping rectangles
 * in a stable coordinate system.
 */
import type { LayoutData, Node } from '../../../types.js';

export interface NodeLayoutOptions {
  gapX?: number;
  gapY?: number;
}

/**
 * Position nodes using BFS layering on the undirected graph.
 *
 * This is a minimal, deterministic TSM-style "topology / shape" step that
 * ensures node rectangles do not overlap and spacing is based on
 * width/height properties.
 */
// The current implementation is synchronous, but we keep this function async
// so that future layout stages can yield or perform async work without
// changing its signature.
// eslint-disable-next-line @typescript-eslint/require-await
export async function layoutOrthogonalNodes(
  data: LayoutData,
  options: NodeLayoutOptions = {}
): Promise<void> {
  const gapX = options.gapX ?? 50;
  const gapY = options.gapY ?? 50;

  const nodes = (data.nodes ?? []).filter((n) => !n.isGroup) as Node[];
  if (nodes.length === 0) {
    return;
  }

  // Build a deterministic node-id map.
  const byId = new Map<string, Node>();
  for (const n of nodes) {
    byId.set(String(n.id), n);
  }

  // Undirected adjacency based on edges.
  const adj = new Map<string, Set<string>>();
  for (const id of byId.keys()) {
    adj.set(id, new Set());
  }
  for (const e of data.edges ?? []) {
    const s = e.start != null ? String(e.start) : null;
    const t = e.end != null ? String(e.end) : null;
    if (!s || !t) {
      continue;
    }
    if (!byId.has(s) || !byId.has(t)) {
      continue;
    }
    adj.get(s)!.add(t);
    adj.get(t)!.add(s);
  }

  // BFS layering on the undirected graph.
  const layerById = new Map<string, number>();
  const visited = new Set<string>();
  const sortedIds = [...byId.keys()].sort((a, b) => a.localeCompare(b));

  for (const rootId of sortedIds) {
    if (visited.has(rootId)) {
      continue;
    }
    const queue: string[] = [];
    queue.push(rootId);
    visited.add(rootId);
    layerById.set(rootId, 0);

    while (queue.length > 0) {
      const id = queue.shift()!;
      const baseLayer = layerById.get(id) ?? 0;
      for (const nb of adj.get(id) ?? []) {
        if (!visited.has(nb)) {
          visited.add(nb);
          layerById.set(nb, baseLayer + 1);
          queue.push(nb);
        }
      }
    }
  }

  // Group nodes by layer.
  const layerToNodes = new Map<number, Node[]>();
  for (const [id, node] of byId) {
    const layer = layerById.get(id) ?? 0;
    if (!layerToNodes.has(layer)) {
      layerToNodes.set(layer, []);
    }
    layerToNodes.get(layer)!.push(node);
    (node as Node & { layer?: number }).layer = layer;
  }

  const sortedLayers = [...layerToNodes.keys()].sort((a, b) => a - b);

  // Compute vertical positions per layer.
  const layerY = new Map<number, number>();
  let currentY = 0;
  for (const layer of sortedLayers) {
    const nodesInLayer = layerToNodes.get(layer)!;
    let maxH = 0;
    for (const n of nodesInLayer) {
      const h = n.height ?? 40;
      if (h > maxH) {
        maxH = h;
      }
    }
    if (maxH === 0) {
      maxH = 40;
    }

    const centreY = currentY + maxH / 2;
    layerY.set(layer, centreY);
    currentY += maxH + gapY;
  }

  // Within each layer, order and position nodes.
  let globalMinLeft = Infinity;
  const orderedByLayer = new Map<number, Node[]>();
  for (const layer of sortedLayers) {
    const nodesInLayer = layerToNodes.get(layer)!;

    let ordered: Node[];
    if (layer === 0) {
      ordered = [...nodesInLayer].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    } else {
      const prevLayer = layer - 1;
      const prevOrdered = orderedByLayer.get(prevLayer) ?? layerToNodes.get(prevLayer);
      if (prevOrdered && prevOrdered.length > 0) {
        const indexInPrev = new Map<string, number>();
        prevOrdered.forEach((n, idx) => {
          indexInPrev.set(String(n.id), idx);
        });

        const scored = nodesInLayer.map((n) => {
          const id = String(n.id);
          const neighbours = adj.get(id) ?? new Set<string>();
          let sum = 0;
          let count = 0;
          for (const nb of neighbours) {
            const nbLayer = layerById.get(nb);
            if (nbLayer === prevLayer) {
              const idx = indexInPrev.get(nb);
              if (idx != null) {
                sum += idx;
                count += 1;
              }
            }
          }
          const barycenter = count > 0 ? sum / count : Number.POSITIVE_INFINITY;
          return { node: n, barycenter };
        });

        scored.sort((a, b) => {
          if (a.barycenter !== b.barycenter) {
            return a.barycenter - b.barycenter;
          }
          return String(a.node.id).localeCompare(String(b.node.id));
        });

        ordered = scored.map((s) => s.node);
      } else {
        ordered = [...nodesInLayer].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      }
    }

    orderedByLayer.set(layer, ordered);

    let currentX = 0;
    const y = layerY.get(layer)!;

    for (const n of ordered) {
      const w = n.width ?? 40;
      const centreX = currentX + w / 2;
      n.x = centreX;
      n.y = y;

      const left = centreX - w / 2;
      if (left < globalMinLeft) {
        globalMinLeft = left;
      }

      currentX += w + gapX;
    }
  }

  // Normalise so that the left-most rectangle starts at x = 0.
  if (globalMinLeft !== Infinity && globalMinLeft !== 0) {
    const shiftX = -globalMinLeft;
    for (const n of nodes) {
      if (typeof n.x === 'number') {
        n.x += shiftX;
      }
    }
  }
}
