/* eslint-disable no-console */
// Layout-time benchmark: `layout: layered` versus dagre, headless (no DOM, no rendering).
// Run: pnpm --filter mermaid bench:layered   (options: --runs <n>, --sizes 7,50,500)
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/index.js';
import type { MermaidConfig } from '../src/config.type.js';
import type { Edge, LayoutData, Node } from '../src/rendering-util/types.js';
import { runLayeredLayoutCore } from '../src/rendering-util/layout-algorithms/layered/layoutData.js';

interface Spec {
  nodes: { id: string; width: number; height: number }[];
  edges: { id: string; start: string; end: string; label: boolean }[];
}

// Deterministic pseudo-random numbers, so every run times the same graphs.
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

// A flowchart-like DAG: a spine plus branches, merges, and some long edges; about 1.4 edges
// per node, a label on every fifth edge. No cycles.
function makeSpec(n: number): Spec {
  const rand = rng(n);
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `N${i}`,
    width: 60 + Math.floor(rand() * 80),
    height: 36 + Math.floor(rand() * 24),
  }));
  const pairs = new Set<string>();
  const edges: Spec['edges'] = [];
  const add = (a: number, b: number) => {
    const key = `${a}-${b}`;
    if (a === b || pairs.has(key)) {
      return;
    }
    pairs.add(key);
    edges.push({
      id: `E${edges.length}`,
      start: `N${a}`,
      end: `N${b}`,
      label: edges.length % 5 === 0,
    });
  };
  for (let i = 1; i < n; i++) {
    add(Math.max(0, i - 1 - Math.floor(rand() * 3)), i);
  }
  for (let k = 0; k < Math.floor(n * 0.4); k++) {
    const a = Math.floor(rand() * (n - 1));
    add(a, Math.min(n - 1, a + 2 + Math.floor(rand() * 8)));
  }
  return { nodes, edges };
}

const NODE_SEP = 50;
const RANK_SEP = 50;
const LABEL = { width: 40, height: 20 };

function layeredInput(spec: Spec): LayoutData {
  return {
    nodes: spec.nodes.map(
      (nd) => ({ ...nd, shape: 'squareRect', isGroup: false, label: nd.id }) as Node
    ),
    edges: spec.edges.map(
      (e) =>
        ({
          id: e.id,
          start: e.start,
          end: e.end,
          type: 'arrow_point',
          arrowTypeEnd: 'arrow_point',
          ...(e.label ? { label: 'label', ...LABEL } : {}),
        }) as Edge
    ),
    config: {} as MermaidConfig,
    direction: 'TB',
    nodeSpacing: NODE_SEP,
    rankSpacing: RANK_SEP,
    layoutAlgorithm: 'layered',
  } as LayoutData;
}

// Mirrors how mermaid's dagre renderer builds its graph (labels as edge label boxes).
function dagreInput(spec: Spec) {
  const g = new graphlib.Graph({ multigraph: true, compound: true });
  g.setGraph({ rankdir: 'TB', nodesep: NODE_SEP, ranksep: RANK_SEP, marginx: 8, marginy: 8 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const nd of spec.nodes) {
    g.setNode(nd.id, { width: nd.width, height: nd.height });
  }
  for (const e of spec.edges) {
    g.setEdge(
      e.start,
      e.end,
      e.label ? { ...LABEL, labelpos: 'c' } : { width: 0, height: 0 },
      e.id
    );
  }
  return g;
}

function time(fn: () => void, runs: number): { median: number; min: number } {
  fn(); // warm-up, not counted
  const samples: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t = performance.now();
    fn();
    samples.push(performance.now() - t);
  }
  samples.sort((a, b) => a - b);
  return { median: samples[Math.floor(samples.length / 2)], min: samples[0] };
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const runs = Number(arg('--runs', '15'));
const sizes = arg('--sizes', '7,50,500').split(',').map(Number);

console.log(`Layout time, headless, median of ${runs} runs after 1 warm-up (ms)`);
console.log('nodes  edges  layered  dagre  layered/dagre');
for (const n of sizes) {
  const spec = makeSpec(n);
  // Guard against timing a no-op: the layered run must place every node and route every edge.
  const probe = layeredInput(spec);
  runLayeredLayoutCore(probe);
  if (
    probe.nodes.some((nd) => typeof nd.x !== 'number') ||
    probe.edges.some((e) => (e.points?.length ?? 0) < 2)
  ) {
    throw new Error(`layered left nodes unplaced or edges unrouted at ${n} nodes`);
  }
  const layered = time(() => runLayeredLayoutCore(layeredInput(spec)), runs);
  const dagre = time(() => dagreLayout(dagreInput(spec), {}), runs);
  const ratio = layered.median / dagre.median;
  console.log(
    `${String(n).padEnd(6)} ${String(spec.edges.length).padEnd(6)} ${layered.median.toFixed(2).padStart(7)} ${dagre.median.toFixed(2).padStart(6)}  ${ratio.toFixed(2)}x`
  );
}
