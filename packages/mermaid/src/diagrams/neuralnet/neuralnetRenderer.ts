import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type {
  NeuralNodeDef,
  NeuralEdgeDef,
  LayerType,
  LayerCategory,
  NeuralnetDB,
} from './neuralnetTypes.js';

// ─── Neuron mode constants ────────────────────────────────────────────────────

const NEURON_R = 18; // circle radius
const NEURON_STEP = 50; // center-to-center vertical spacing
const MAX_SHOW = 8; // max circles drawn per layer before truncation
const LAYER_COL_GAP = 110; // horizontal gap between layer columns
const NEURON_LABEL_H = 24; // height reserved for layer type label above column

// Colors for neuron circles by category
const NEURON_FILL: Record<LayerCategory, { fill: string; stroke: string; text: string }> = {
  input: { fill: '#82c46e', stroke: '#4a8a3a', text: '#2c3e50' },
  output: { fill: '#e07080', stroke: '#b04060', text: '#fff' },
  dense: { fill: '#8080d0', stroke: '#5050a0', text: '#fff' },
  conv: { fill: '#e0904a', stroke: '#b06020', text: '#fff' },
  pool: { fill: '#40b0a0', stroke: '#208070', text: '#fff' },
  norm: { fill: '#e0c040', stroke: '#b09010', text: '#2c3e50' },
  dropout: { fill: '#a0a8b0', stroke: '#707880', text: '#fff' },
  structural: { fill: '#c0c8d0', stroke: '#9098a0', text: '#2c3e50' },
  recurrent: { fill: '#c04040', stroke: '#902020', text: '#fff' },
  merge: { fill: '#40c8a8', stroke: '#209880', text: '#fff' },
  attention: { fill: '#4090c8', stroke: '#206898', text: '#fff' },
  activation: { fill: '#d0d8e0', stroke: '#a0a8b0', text: '#2c3e50' },
};

// ─── Neuron count extraction ──────────────────────────────────────────────────

function getNeuronCount(node: NeuralNodeDef): number {
  const first = parseInt(node.params[0], 10);
  if (node.layerType === 'Input') {
    const dims = node.params.map((p) => parseInt(p, 10)).filter((n) => !isNaN(n));
    if (dims.length === 0) {
      return 1;
    }
    // Flatten multi-dim inputs (28,28,1 → 784); 1-dim inputs shown as-is
    return dims.length === 1 ? dims[0] : dims.reduce((a, b) => a * b, 1);
  }
  return isNaN(first) ? 1 : first;
}

interface NeuronSlot {
  label: string;
  isEllipsis: boolean;
}

function getNeuronSlots(count: number): NeuronSlot[] {
  if (count <= MAX_SHOW) {
    return Array.from({ length: count }, (_, i) => ({ label: String(i + 1), isEllipsis: false }));
  }
  return [
    { label: '1', isEllipsis: false },
    { label: '2', isEllipsis: false },
    { label: '3', isEllipsis: false },
    { label: '⋮', isEllipsis: true },
    { label: String(count - 1), isEllipsis: false },
    { label: String(count), isEllipsis: false },
  ];
}

// ─── Neuron-mode draw ─────────────────────────────────────────────────────────

function drawNeuronMode(
  svg: SVG,
  id: string,
  nodeOrder: string[],
  nodes: Map<string, NeuralNodeDef>,
  edges: NeuralEdgeDef[],
  title: string
): { w: number; h: number } {
  const PADDING = 40;
  const TITLE_H = title ? 36 : 0;

  // Build ordered list of layers to render
  const layerIds = nodeOrder.filter((nid) => nodes.has(nid));

  // Pre-compute slots per layer
  const layerSlots = layerIds.map((nid) => {
    const node = nodes.get(nid)!;
    const count = getNeuronCount(node);
    return { nid, node, count, slots: getNeuronSlots(count) };
  });

  const maxSlots = Math.max(...layerSlots.map((l) => l.slots.length), 1);
  const colH = maxSlots * NEURON_STEP;
  const canvasH = PADDING + TITLE_H + NEURON_LABEL_H + colH + NEURON_R + PADDING;
  const canvasW =
    PADDING + layerIds.length * (NEURON_R * 2 + LAYER_COL_GAP) - LAYER_COL_GAP + PADDING;

  // Column x centers
  const colCx = layerIds.map((_, i) => PADDING + NEURON_R + i * (NEURON_R * 2 + LAYER_COL_GAP));

  // Y-center for slot index within a column (vertically centered in colH)
  const slotCy = (slots: NeuronSlot[], slotIdx: number): number => {
    const totalH = (slots.length - 1) * NEURON_STEP;
    const top = PADDING + TITLE_H + NEURON_LABEL_H + (colH - totalH) / 2 + NEURON_R;
    return top + slotIdx * NEURON_STEP;
  };

  // ── Title ──
  if (title) {
    svg
      .append('text')
      .attr('x', canvasW / 2)
      .attr('y', PADDING + 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(title);
  }

  // ── Arrow marker ──
  svg
    .append('defs')
    .append('marker')
    .attr('id', `${id}-nh-arrow`)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', '#aaa');

  // ── Connections ──
  // In sequential mode auto-edges; in graph mode use explicit edges
  const connPairs: [string, string][] = edges.map((e) => [e.from, e.to]);

  const connG = svg.append('g').attr('class', 'neuron-connections');
  for (const [fromId, toId] of connPairs) {
    const fromIdx = layerIds.indexOf(fromId);
    const toIdx = layerIds.indexOf(toId);
    if (fromIdx < 0 || toIdx < 0) {
      continue;
    }

    const { slots: fromSlots } = layerSlots[fromIdx];
    const { slots: toSlots } = layerSlots[toIdx];
    const x1 = colCx[fromIdx] + NEURON_R;
    const x2 = colCx[toIdx] - NEURON_R;

    for (let fi = 0; fi < fromSlots.length; fi++) {
      if (fromSlots[fi].isEllipsis) {
        continue;
      }
      for (let ti = 0; ti < toSlots.length; ti++) {
        if (toSlots[ti].isEllipsis) {
          continue;
        }
        connG
          .append('line')
          .attr('x1', x1)
          .attr('y1', slotCy(fromSlots, fi))
          .attr('x2', x2)
          .attr('y2', slotCy(toSlots, ti))
          .attr('stroke', '#bbb')
          .attr('stroke-width', 0.8)
          .attr('opacity', 0.6);
      }
    }
  }

  // ── Layer columns ──
  layerSlots.forEach(({ nid, node, count, slots }, colIdx) => {
    const cat = getCategory(node.layerType);
    const colors = NEURON_FILL[cat];
    const cx = colCx[colIdx];
    const layerG = svg.append('g').attr('class', `neuron-layer ${cat}`).attr('data-id', nid);

    // Layer type label above column
    const shortName = node.layerType.replace(/\d+D$/, '').slice(0, 7);
    layerG
      .append('text')
      .attr('x', cx)
      .attr('y', PADDING + TITLE_H + NEURON_LABEL_H - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#555')
      .text(shortName);

    // Count badge below label
    layerG
      .append('text')
      .attr('x', cx)
      .attr('y', PADDING + TITLE_H + NEURON_LABEL_H + 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#888')
      .text(`(${count})`);

    // Draw circles
    slots.forEach((slot, si) => {
      const cy = slotCy(slots, si);
      const isEllipsis = slot.isEllipsis;

      layerG
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', NEURON_R)
        .attr('fill', isEllipsis ? '#f0f0f0' : colors.fill)
        .attr('stroke', isEllipsis ? '#ccc' : colors.stroke)
        .attr('stroke-width', 2);

      layerG
        .append('text')
        .attr('x', cx)
        .attr('y', cy)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', isEllipsis ? '16px' : '11px')
        .attr('font-weight', isEllipsis ? 'normal' : 'bold')
        .attr('fill', isEllipsis ? '#999' : colors.text)
        .text(slot.label);
    });
  });

  return { w: canvasW, h: canvasH };
}

// ─── Layout constants ────────────────────────────────────────────────────────

const NODE_W = 180;
const NODE_H = 60;
const V_GAP = 50; // vertical gap between sequential layers
const H_GAP = 60; // horizontal gap between parallel branches
const PADDING = 48;
const TITLE_H = 30;

// ─── Category helpers ────────────────────────────────────────────────────────

const CATEGORY_MAP: Partial<Record<LayerType, LayerCategory>> = {
  Input: 'input',
  Output: 'output',
  Dense: 'dense',
  Linear: 'dense',
  Conv1D: 'conv',
  Conv2D: 'conv',
  Conv3D: 'conv',
  MaxPool1D: 'pool',
  MaxPool2D: 'pool',
  MaxPool3D: 'pool',
  AvgPool1D: 'pool',
  AvgPool2D: 'pool',
  AvgPool3D: 'pool',
  GlobalAvgPool: 'pool',
  GlobalMaxPool: 'pool',
  BatchNorm: 'norm',
  LayerNorm: 'norm',
  GroupNorm: 'norm',
  Dropout: 'dropout',
  Flatten: 'structural',
  Reshape: 'structural',
  Embedding: 'structural',
  LSTM: 'recurrent',
  GRU: 'recurrent',
  RNN: 'recurrent',
  Bidirectional: 'recurrent',
  Add: 'merge',
  Concat: 'merge',
  Multiply: 'merge',
  Attention: 'attention',
  MultiHeadAttention: 'attention',
  Activation: 'activation',
  ReLU: 'activation',
  Sigmoid: 'activation',
  Softmax: 'activation',
  Tanh: 'activation',
  GELU: 'activation',
};

// Applied directly via D3 attributes so rendering doesn't depend on CSS injection
const CATEGORY_COLORS: Record<LayerCategory, { fill: string; stroke: string; text: string }> = {
  input: { fill: '#4A90D9', stroke: '#2E6DA4', text: '#ffffff' },
  output: { fill: '#27AE60', stroke: '#1E8449', text: '#ffffff' },
  dense: { fill: '#8E44AD', stroke: '#6C3483', text: '#ffffff' },
  conv: { fill: '#E67E22', stroke: '#CA6F1E', text: '#ffffff' },
  pool: { fill: '#16A085', stroke: '#0E6655', text: '#ffffff' },
  norm: { fill: '#F39C12', stroke: '#D68910', text: '#ffffff' },
  dropout: { fill: '#95A5A6', stroke: '#717D7E', text: '#ffffff' },
  structural: { fill: '#BDC3C7', stroke: '#95A5A6', text: '#2c3e50' },
  recurrent: { fill: '#C0392B', stroke: '#96281B', text: '#ffffff' },
  merge: { fill: '#1ABC9C', stroke: '#148F77', text: '#ffffff' },
  attention: { fill: '#2980B9', stroke: '#1F618D', text: '#ffffff' },
  activation: { fill: '#D5D8DC', stroke: '#AAB7B8', text: '#2c3e50' },
};

function getCategory(type: LayerType): LayerCategory {
  return CATEGORY_MAP[type] ?? 'structural';
}

// ─── Shape computation ───────────────────────────────────────────────────────

function computeOutputShape(node: NeuralNodeDef, inputShape?: number[]): number[] | undefined {
  const p = node.params;
  switch (node.layerType) {
    case 'Input': {
      const s = p.map((v) => parseInt(v, 10)).filter((n) => !isNaN(n));
      return s.length ? s : undefined;
    }
    case 'Dense':
    case 'Linear': {
      if (!inputShape) {
        return undefined;
      }
      const units = parseInt(p[0], 10);
      return isNaN(units) ? undefined : [...inputShape.slice(0, -1), units];
    }
    case 'Conv2D': {
      if (!inputShape || inputShape.length < 2) {
        return undefined;
      }
      const filters = parseInt(p[0], 10);
      const [kh, kw] = (p[1] ?? '3x3').split('x').map(Number);
      return [inputShape[0] - kh + 1, inputShape[1] - kw + 1, filters];
    }
    case 'MaxPool2D':
    case 'AvgPool2D': {
      if (!inputShape || inputShape.length < 3) {
        return undefined;
      }
      const [ph, pw] = (p[0] ?? '2x2').split('x').map(Number);
      return [Math.floor(inputShape[0] / ph), Math.floor(inputShape[1] / pw), inputShape[2]];
    }
    case 'Flatten': {
      if (!inputShape) {
        return undefined;
      }
      return [inputShape.reduce((a, b) => a * b, 1)];
    }
    // Pass-through layers
    case 'BatchNorm':
    case 'LayerNorm':
    case 'GroupNorm':
    case 'Dropout':
    case 'Activation':
    case 'ReLU':
    case 'Sigmoid':
    case 'Softmax':
    case 'Tanh':
    case 'GELU':
      return inputShape;
    default:
      return inputShape;
  }
}

function propagateShapes(orderedNodes: NeuralNodeDef[]): void {
  let current: number[] | undefined;
  for (const node of orderedNodes) {
    node.inputShape = current;
    current = computeOutputShape(node, current);
    node.outputShape = current;
  }
}

function fmtShape(s?: number[]): string {
  return s ? `(${s.join('×')})` : '';
}

// ─── Display label helpers ───────────────────────────────────────────────────

function getDisplayText(node: NeuralNodeDef): { main: string; sub: string } {
  const p = node.params;
  switch (node.layerType) {
    case 'Input':
      return { main: 'Input', sub: p.join('×') };
    case 'Output':
      return { main: 'Output', sub: p.join(', ') };
    case 'Dense':
      return { main: 'Dense', sub: `${p[0] ?? '?'} units` + (p[1] ? ` · ${p[1]}` : '') };
    case 'Linear':
      return { main: 'Linear', sub: `${p[0] ?? '?'} units` };
    case 'Conv2D':
      return {
        main: 'Conv2D',
        sub: `${p[0] ?? '?'}@${p[1] ?? '3×3'}` + (p[2] ? ` · ${p[2]}` : ''),
      };
    case 'Conv1D':
      return { main: 'Conv1D', sub: `${p[0] ?? '?'} filters` };
    case 'Conv3D':
      return { main: 'Conv3D', sub: `${p[0] ?? '?'} filters` };
    case 'MaxPool2D':
      return { main: 'MaxPool', sub: p[0] ?? '2×2' };
    case 'AvgPool2D':
      return { main: 'AvgPool', sub: p[0] ?? '2×2' };
    case 'GlobalAvgPool':
      return { main: 'GlobalAvgPool', sub: '' };
    case 'GlobalMaxPool':
      return { main: 'GlobalMaxPool', sub: '' };
    case 'BatchNorm':
      return { main: 'BatchNorm', sub: '' };
    case 'LayerNorm':
      return { main: 'LayerNorm', sub: '' };
    case 'GroupNorm':
      return { main: 'GroupNorm', sub: p[0] ? `groups=${p[0]}` : '' };
    case 'Dropout':
      return { main: 'Dropout', sub: `p=${p[0] ?? '0.5'}` };
    case 'Flatten':
      return { main: 'Flatten', sub: '' };
    case 'Reshape':
      return { main: 'Reshape', sub: p.join(', ') };
    case 'Embedding':
      return { main: 'Embedding', sub: `${p[0] ?? '?'}×${p[1] ?? '?'}` };
    case 'LSTM':
      return { main: 'LSTM', sub: `${p[0] ?? '?'} units` };
    case 'GRU':
      return { main: 'GRU', sub: `${p[0] ?? '?'} units` };
    case 'RNN':
      return { main: 'RNN', sub: `${p[0] ?? '?'} units` };
    case 'Bidirectional':
      return { main: 'Bidirectional', sub: p[0] ?? '' };
    case 'Add':
      return { main: 'Add', sub: '' };
    case 'Concat':
      return { main: 'Concat', sub: p[0] ? `axis=${p[0]}` : '' };
    case 'Multiply':
      return { main: 'Multiply', sub: '' };
    case 'Attention':
      return { main: 'Attention', sub: '' };
    case 'MultiHeadAttention':
      return { main: 'MultiHead\nAttn', sub: `heads=${p[0] ?? '?'}` };
    case 'Activation':
      return { main: 'Activation', sub: p[0] ?? '' };
    case 'ReLU':
      return { main: 'ReLU', sub: '' };
    case 'Sigmoid':
      return { main: 'Sigmoid', sub: '' };
    case 'Softmax':
      return { main: 'Softmax', sub: '' };
    case 'Tanh':
      return { main: 'Tanh', sub: '' };
    case 'GELU':
      return { main: 'GELU', sub: '' };
    default:
      return { main: node.layerType, sub: p.join(', ') };
  }
}

// ─── Layout computation ──────────────────────────────────────────────────────

interface NodeLayout {
  id: string;
  x: number;
  y: number;
  node: NeuralNodeDef;
}

function layoutSequential(nodeOrder: string[], nodes: Map<string, NeuralNodeDef>): NodeLayout[] {
  return nodeOrder
    .filter((id) => nodes.has(id))
    .map((id, i) => ({
      id,
      x: PADDING,
      y: PADDING + TITLE_H + i * (NODE_H + V_GAP),
      node: nodes.get(id)!,
    }));
}

function layoutGraph(
  nodeOrder: string[],
  nodes: Map<string, NeuralNodeDef>,
  edges: NeuralEdgeDef[]
): NodeLayout[] {
  // Build adjacency / in-degree
  const inDeg = new Map<string, number>();
  const outAdj = new Map<string, string[]>();
  for (const id of nodeOrder) {
    inDeg.set(id, 0);
    outAdj.set(id, []);
  }
  for (const e of edges) {
    inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
    outAdj.get(e.from)?.push(e.to);
  }

  // Longest-path layering via BFS
  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const [id, d] of inDeg) {
    if (d === 0) {
      depth.set(id, 0);
      queue.push(id);
    }
  }

  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of outAdj.get(cur) ?? []) {
      const nd = Math.max(depth.get(next) ?? 0, (depth.get(cur) ?? 0) + 1);
      depth.set(next, nd);
      inDeg.set(next, (inDeg.get(next) ?? 1) - 1);
      if (inDeg.get(next) === 0) {
        queue.push(next);
      }
    }
  }

  // Group by depth
  const groups = new Map<number, string[]>();
  for (const [id, d] of depth) {
    if (!groups.has(d)) {
      groups.set(d, []);
    }
    groups.get(d)!.push(id);
  }

  const maxDepth = Math.max(0, ...depth.values());
  const maxWidth = Math.max(...[...groups.values()].map((g) => g.length));
  const totalW = maxWidth * NODE_W + (maxWidth - 1) * H_GAP;

  const layout: NodeLayout[] = [];
  for (let d = 0; d <= maxDepth; d++) {
    const group = groups.get(d) ?? [];
    const rowW = group.length * NODE_W + (group.length - 1) * H_GAP;
    const startX = PADDING + (totalW - rowW) / 2;
    group.forEach((id, i) => {
      layout.push({
        id,
        x: startX + i * (NODE_W + H_GAP),
        y: PADDING + TITLE_H + d * (NODE_H + V_GAP),
        node: nodes.get(id)!,
      });
    });
  }
  return layout;
}

// ─── Main draw function ──────────────────────────────────────────────────────

export const draw: DrawDefinition = (_text, id, _version, diagObj) => {
  const db = diagObj.db as NeuralnetDB;
  const mode = db.getMode();
  const renderStyle = db.getRenderStyle();
  const nodes = db.getNodes();
  const edges = db.getEdges();
  const nodeOrder = db.getNodeOrder();
  const title = db.getDiagramTitle();

  const svg: SVG = selectSvgElement(id);
  svg.attr('class', 'neuralnet-diagram');

  // ── Neuron mode ───────────────────────────────────────────────────────────
  if (renderStyle === 'neuron') {
    const { w, h } = drawNeuronMode(svg, id, nodeOrder, nodes, edges, title);
    configureSvgSize(svg, h, w, false);
    return;
  }

  // Shape propagation (sequential only; graph shape inference is future work)
  if (mode === 'sequential') {
    const ordered = nodeOrder.map((nid) => nodes.get(nid)).filter(Boolean) as NeuralNodeDef[];
    propagateShapes(ordered);
  }

  const layout =
    mode === 'sequential'
      ? layoutSequential(nodeOrder, nodes)
      : layoutGraph(nodeOrder, nodes, edges);

  const byId = new Map(layout.map((l) => [l.id, l]));

  // Canvas dimensions
  const canvasW = Math.max(PADDING * 2 + NODE_W, ...layout.map((l) => l.x + NODE_W)) + PADDING;
  const canvasH = Math.max(PADDING * 2 + NODE_H, ...layout.map((l) => l.y + NODE_H)) + PADDING;

  // Arrow-head marker
  const defs = svg.append('defs');
  defs
    .append('marker')
    .attr('id', `${id}-arrowhead`)
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', '#666');

  // Title
  if (title) {
    svg
      .append('text')
      .attr('class', 'diagram-title')
      .attr('x', canvasW / 2)
      .attr('y', PADDING)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(title);
  }

  // ── Edges ──────────────────────────────────────────────────────────────────
  const edgeG = svg.append('g').attr('class', 'edges');

  for (const edge of edges) {
    const src = byId.get(edge.from);
    const tgt = byId.get(edge.to);
    if (!src || !tgt) {
      continue;
    }

    const x1 = src.x + NODE_W / 2;
    const y1 = src.y + NODE_H;
    const x2 = tgt.x + NODE_W / 2;
    const y2 = tgt.y;
    const cy = (y1 + y2) / 2;

    edgeG
      .append('path')
      .attr('class', 'edge')
      .attr('d', `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`)
      .attr('fill', 'none')
      .attr('stroke', '#666')
      .attr('stroke-width', 1.5)
      .attr('marker-end', `url(#${id}-arrowhead)`);

    // Output-shape label on the edge
    const srcNode = nodes.get(edge.from);
    if (srcNode?.outputShape) {
      edgeG
        .append('text')
        .attr('class', 'shape-label')
        .attr('x', (x1 + x2) / 2)
        .attr('y', cy - 4)
        .attr('text-anchor', 'middle')
        .text(fmtShape(srcNode.outputShape));
    }
  }

  // ── Nodes ──────────────────────────────────────────────────────────────────
  const nodeG = svg.append('g').attr('class', 'nodes');

  for (const { id: nodeId, x, y, node } of layout) {
    const cat = getCategory(node.layerType);
    const colors = CATEGORY_COLORS[cat];
    const { main, sub } = getDisplayText(node);
    const hasSubLabel = sub.trim().length > 0;

    const g = nodeG
      .append('g')
      .attr('class', `node ${cat}`)
      .attr('data-id', nodeId)
      .attr('transform', `translate(${x},${y})`);

    g.append('rect')
      .attr('width', NODE_W)
      .attr('height', NODE_H)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', colors.fill)
      .attr('stroke', colors.stroke)
      .attr('stroke-width', 2);

    // Main type label
    g.append('text')
      .attr('x', NODE_W / 2)
      .attr('y', hasSubLabel ? NODE_H / 2 - 8 : NODE_H / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .attr('fill', colors.text)
      .text(main);

    // Sub label (params summary)
    if (hasSubLabel) {
      g.append('text')
        .attr('class', 'sub-label')
        .attr('x', NODE_W / 2)
        .attr('y', NODE_H / 2 + 12)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '11px')
        .attr('fill', colors.text)
        .attr('opacity', 0.88)
        .text(sub);
    }
  }

  // useMaxWidth:false — set explicit height so tall sequential diagrams aren't clipped.
  // With useMaxWidth:true the SVG height is inferred from viewBox aspect ratio,
  // which collapses a tall narrow diagram to just one visible row.
  configureSvgSize(svg, canvasH, canvasW, false);
};

export const renderer = { draw };
