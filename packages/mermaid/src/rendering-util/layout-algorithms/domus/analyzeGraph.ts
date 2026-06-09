import type { LayoutData, Edge } from '../../types.js';

export interface AntiParallelPair {
  u: string;
  v: string;
  uvEdgeIds: string[];
  vuEdgeIds: string[];
}

export interface MultiEdgeGroup {
  /** Unordered endpoint IDs (`u <= v` lexicographically). */
  u: string;
  v: string;
  /** All edge IDs between u and v in either direction. */
  edgeIds: string[];
  /** Edge IDs in each direction (if any). */
  uvEdgeIds: string[];
  vuEdgeIds: string[];
}

export interface GraphAnalysis {
  hasCycle: boolean;
  /** Strongly connected components (directed), each list sorted. */
  sccs: string[][];
  antiParallelPairs: AntiParallelPair[];
  multiEdgeGroups: MultiEdgeGroup[];
}

function edgeIdOf(e: Edge, fallback: string): string {
  return e?.id != null ? String(e.id) : fallback;
}

/**
 * Step 1 (prompt.md): analyze the directed graph.
 *
 * - Cycle detection via SCCs (Tarjan).
 * - Anti-parallel pairs: `u->v` and `v->u` both present.
 * - Multi-edge groups: multiple edges between the same unordered endpoints.
 */
export function analyzeGraph(layout: LayoutData): GraphAnalysis {
  const edges = layout.edges ?? [];
  const nodes = layout.nodes ?? [];

  // In orthogonal layout, edge labels are represented as intermediate nodes (label nodes),
  // and labeled edges are split into:
  //   start -> labelNode, labelNode -> end
  // For analysis (cycles / anti-parallel / multi-edges) we want the *semantic* graph
  // over real endpoints, so we treat label nodes as transparent using their metadata.
  const labelNodeInfo = new Map<string, { edgeStart: string; edgeEnd: string }>();
  for (const n of nodes) {
    const id = n?.id != null ? String(n.id) : '';
    if (!id) {
      continue;
    }
    const isLabel = Boolean((n as any).isEdgeLabel) || id.startsWith('edge-label-');
    const edgeStart = (n as any).edgeStart != null ? String((n as any).edgeStart) : '';
    const edgeEnd = (n as any).edgeEnd != null ? String((n as any).edgeEnd) : '';
    if (isLabel && edgeStart && edgeEnd) {
      labelNodeInfo.set(id, { edgeStart, edgeEnd });
    }
  }

  // Directed adjacency, but keep a stable node set from endpoints.
  const semanticNodes = new Set<string>();
  const out = new Map<string, string[]>();
  const selfLoops = new Set<string>();

  const dirKeyToEdgeIds = new Map<string, string[]>(); // `${u}->${v}` -> [edgeId...]
  const seenLabelBaseEdgeIds = new Set<string>();

  for (const e of edges) {
    let s = e.start != null ? String(e.start) : '';
    let t = e.end != null ? String(e.end) : '';
    if (!s || !t) {
      continue;
    }

    // Collapse label-node endpoints to semantic endpoints.
    const sLabel = labelNodeInfo.get(s);
    const tLabel = labelNodeInfo.get(t);
    if (sLabel) {
      s = sLabel.edgeStart;
    }
    if (tLabel) {
      t = tLabel.edgeEnd;
    }
    if (!s || !t) {
      continue;
    }

    // De-duplicate split label edges: both `*-to-label` and `*-from-label` map to the same
    // semantic edge; keep only one deterministic representative.
    let id = edgeIdOf(e, `${s}->${t}`);
    if (typeof (e as any).id === 'string') {
      const raw = String((e as any).id);
      if (raw.endsWith('-to-label')) {
        id = raw.slice(0, -'-to-label'.length);
      } else if (raw.endsWith('-from-label')) {
        id = raw.slice(0, -'-from-label'.length);
      }
      if (raw.endsWith('-to-label') || raw.endsWith('-from-label')) {
        if (seenLabelBaseEdgeIds.has(id)) {
          continue;
        }
        seenLabelBaseEdgeIds.add(id);
      }
    }

    semanticNodes.add(s);
    semanticNodes.add(t);
    const key = `${s}->${t}`;
    const arr = dirKeyToEdgeIds.get(key) ?? [];
    arr.push(String(id));
    dirKeyToEdgeIds.set(key, arr);

    if (s === t) {
      selfLoops.add(s);
    }

    const adj = out.get(s) ?? [];
    adj.push(t);
    out.set(s, adj);
  }

  const nodeList = [...semanticNodes].sort((a, b) => a.localeCompare(b));
  for (const n of nodeList) {
    out.set(
      n,
      [...(out.get(n) ?? [])].sort((a, b) => a.localeCompare(b))
    );
  }

  // Tarjan SCC (directed).
  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const idx = new Map<string, number>();
  const low = new Map<string, number>();
  const sccs: string[][] = [];

  const strongConnect = (v: string) => {
    idx.set(v, index);
    low.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of out.get(v) ?? []) {
      if (!idx.has(w)) {
        strongConnect(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, idx.get(w)!));
      }
    }

    if (low.get(v) === idx.get(v)) {
      const comp: string[] = [];
      while (stack.length > 0) {
        const w = stack.pop()!;
        onStack.delete(w);
        comp.push(w);
        if (w === v) {
          break;
        }
      }
      comp.sort((a, b) => a.localeCompare(b));
      sccs.push(comp);
    }
  };

  for (const v of nodeList) {
    if (!idx.has(v)) {
      strongConnect(v);
    }
  }

  // Deterministic SCC ordering: by (size desc, then lexicographic).
  sccs.sort((a, b) => {
    if (a.length !== b.length) {
      return b.length - a.length;
    }
    return (a[0] ?? '').localeCompare(b[0] ?? '');
  });

  // Anti-parallel + multi-edge groups.
  const unorderedKeyToDirs = new Map<
    string,
    { u: string; v: string; uv: string[]; vu: string[] }
  >();

  const sortedPair = (a: string, b: string) => (a.localeCompare(b) <= 0 ? [a, b] : [b, a]);

  for (const [dirKey, ids] of dirKeyToEdgeIds) {
    const sep = dirKey.indexOf('->');
    const s = dirKey.slice(0, sep);
    const t = dirKey.slice(sep + 2);
    const [u, v] = sortedPair(s, t);
    const k = `${u}||${v}`;
    const rec = unorderedKeyToDirs.get(k) ?? { u, v, uv: [], vu: [] };
    if (s === u && t === v) {
      rec.uv.push(...ids);
    } else {
      rec.vu.push(...ids);
    }
    unorderedKeyToDirs.set(k, rec);
  }

  const antiParallelPairs: AntiParallelPair[] = [];
  const multiEdgeGroups: MultiEdgeGroup[] = [];

  for (const rec of unorderedKeyToDirs.values()) {
    rec.uv.sort((a, b) => a.localeCompare(b));
    rec.vu.sort((a, b) => a.localeCompare(b));
    const all = [...rec.uv, ...rec.vu];
    if (all.length > 1) {
      multiEdgeGroups.push({
        u: rec.u,
        v: rec.v,
        edgeIds: [...all].sort((a, b) => a.localeCompare(b)),
        uvEdgeIds: rec.uv,
        vuEdgeIds: rec.vu,
      });
    }
    if (rec.uv.length > 0 && rec.vu.length > 0) {
      antiParallelPairs.push({
        u: rec.u,
        v: rec.v,
        uvEdgeIds: rec.uv,
        vuEdgeIds: rec.vu,
      });
    }
  }

  multiEdgeGroups.sort((a, b) => a.u.localeCompare(b.u) || a.v.localeCompare(b.v));
  antiParallelPairs.sort((a, b) => a.u.localeCompare(b.u) || a.v.localeCompare(b.v));

  const hasCycle = selfLoops.size > 0 || sccs.some((c) => c.length > 1);

  return { hasCycle, sccs, antiParallelPairs, multiEdgeGroups };
}
