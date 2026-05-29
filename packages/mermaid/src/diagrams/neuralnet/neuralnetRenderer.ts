import { select } from 'd3';
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { NeuralNodeDef, NeuralEdgeDef, LayerType, LayerCategory, NeuralnetDB } from './neuralnetTypes.js';

// ─── Layout constants ────────────────────────────────────────────────────────

const NODE_W = 180;
const NODE_H = 60;
const V_GAP = 50;  // vertical gap between sequential layers
const H_GAP = 60;  // horizontal gap between parallel branches
const PADDING = 48;
const TITLE_H = 30;

// ─── Category helpers ────────────────────────────────────────────────────────

const CATEGORY_MAP: Partial<Record<LayerType, LayerCategory>> = {
  Input: 'input', Output: 'output',
  Dense: 'dense', Linear: 'dense',
  Conv1D: 'conv', Conv2D: 'conv', Conv3D: 'conv',
  MaxPool1D: 'pool', MaxPool2D: 'pool', MaxPool3D: 'pool',
  AvgPool1D: 'pool', AvgPool2D: 'pool', AvgPool3D: 'pool',
  GlobalAvgPool: 'pool', GlobalMaxPool: 'pool',
  BatchNorm: 'norm', LayerNorm: 'norm', GroupNorm: 'norm',
  Dropout: 'dropout',
  Flatten: 'structural', Reshape: 'structural', Embedding: 'structural',
  LSTM: 'recurrent', GRU: 'recurrent', RNN: 'recurrent', Bidirectional: 'recurrent',
  Add: 'merge', Concat: 'merge', Multiply: 'merge',
  Attention: 'attention', MultiHeadAttention: 'attention',
  Activation: 'activation', ReLU: 'activation', Sigmoid: 'activation',
  Softmax: 'activation', Tanh: 'activation', GELU: 'activation',
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
      if (!inputShape) return undefined;
      const units = parseInt(p[0], 10);
      return isNaN(units) ? undefined : [...inputShape.slice(0, -1), units];
    }
    case 'Conv2D': {
      if (!inputShape || inputShape.length < 2) return undefined;
      const filters = parseInt(p[0], 10);
      const [kh, kw] = (p[1] ?? '3x3').split('x').map(Number);
      return [inputShape[0] - kh + 1, inputShape[1] - kw + 1, filters];
    }
    case 'MaxPool2D':
    case 'AvgPool2D': {
      if (!inputShape || inputShape.length < 3) return undefined;
      const [ph, pw] = (p[0] ?? '2x2').split('x').map(Number);
      return [Math.floor(inputShape[0] / ph), Math.floor(inputShape[1] / pw), inputShape[2]];
    }
    case 'Flatten': {
      if (!inputShape) return undefined;
      return [inputShape.reduce((a, b) => a * b, 1)];
    }
    // Pass-through layers
    case 'BatchNorm': case 'LayerNorm': case 'GroupNorm':
    case 'Dropout':
    case 'Activation': case 'ReLU': case 'Sigmoid': case 'Softmax': case 'Tanh': case 'GELU':
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
    case 'Input':    return { main: 'Input',       sub: p.join('×') };
    case 'Output':   return { main: 'Output',      sub: p.join(', ') };
    case 'Dense':    return { main: 'Dense',        sub: `${p[0] ?? '?'} units` + (p[1] ? ` · ${p[1]}` : '') };
    case 'Linear':   return { main: 'Linear',       sub: `${p[0] ?? '?'} units` };
    case 'Conv2D':   return { main: 'Conv2D',        sub: `${p[0] ?? '?'}@${p[1] ?? '3×3'}` + (p[2] ? ` · ${p[2]}` : '') };
    case 'Conv1D':   return { main: 'Conv1D',        sub: `${p[0] ?? '?'} filters` };
    case 'Conv3D':   return { main: 'Conv3D',        sub: `${p[0] ?? '?'} filters` };
    case 'MaxPool2D': return { main: 'MaxPool',      sub: p[0] ?? '2×2' };
    case 'AvgPool2D': return { main: 'AvgPool',      sub: p[0] ?? '2×2' };
    case 'GlobalAvgPool': return { main: 'GlobalAvgPool', sub: '' };
    case 'GlobalMaxPool': return { main: 'GlobalMaxPool', sub: '' };
    case 'BatchNorm': return { main: 'BatchNorm',    sub: '' };
    case 'LayerNorm': return { main: 'LayerNorm',    sub: '' };
    case 'GroupNorm': return { main: 'GroupNorm',    sub: p[0] ? `groups=${p[0]}` : '' };
    case 'Dropout':   return { main: 'Dropout',      sub: `p=${p[0] ?? '0.5'}` };
    case 'Flatten':   return { main: 'Flatten',      sub: '' };
    case 'Reshape':   return { main: 'Reshape',      sub: p.join(', ') };
    case 'Embedding': return { main: 'Embedding',    sub: `${p[0] ?? '?'}×${p[1] ?? '?'}` };
    case 'LSTM':      return { main: 'LSTM',          sub: `${p[0] ?? '?'} units` };
    case 'GRU':       return { main: 'GRU',           sub: `${p[0] ?? '?'} units` };
    case 'RNN':       return { main: 'RNN',           sub: `${p[0] ?? '?'} units` };
    case 'Bidirectional': return { main: 'Bidirectional', sub: p[0] ?? '' };
    case 'Add':       return { main: 'Add',           sub: '' };
    case 'Concat':    return { main: 'Concat',        sub: p[0] ? `axis=${p[0]}` : '' };
    case 'Multiply':  return { main: 'Multiply',      sub: '' };
    case 'Attention': return { main: 'Attention',     sub: '' };
    case 'MultiHeadAttention': return { main: 'MultiHead\nAttn', sub: `heads=${p[0] ?? '?'}` };
    case 'Activation': return { main: 'Activation',   sub: p[0] ?? '' };
    case 'ReLU':      return { main: 'ReLU',          sub: '' };
    case 'Sigmoid':   return { main: 'Sigmoid',       sub: '' };
    case 'Softmax':   return { main: 'Softmax',       sub: '' };
    case 'Tanh':      return { main: 'Tanh',          sub: '' };
    case 'GELU':      return { main: 'GELU',          sub: '' };
    default:          return { main: node.layerType,  sub: p.join(', ') };
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
  for (const id of nodeOrder) { inDeg.set(id, 0); outAdj.set(id, []); }
  for (const e of edges) {
    inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
    outAdj.get(e.from)?.push(e.to);
  }

  // Longest-path layering via BFS
  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const [id, d] of inDeg) { if (d === 0) { depth.set(id, 0); queue.push(id); } }

  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of (outAdj.get(cur) ?? [])) {
      const nd = Math.max(depth.get(next) ?? 0, (depth.get(cur) ?? 0) + 1);
      depth.set(next, nd);
      inDeg.set(next, (inDeg.get(next) ?? 1) - 1);
      if (inDeg.get(next) === 0) queue.push(next);
    }
  }

  // Group by depth
  const groups = new Map<number, string[]>();
  for (const [id, d] of depth) {
    if (!groups.has(d)) groups.set(d, []);
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
  const nodes = db.getNodes();
  const edges = db.getEdges();
  const nodeOrder = db.getNodeOrder();
  const title = db.getDiagramTitle();

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
  const canvasW =
    Math.max(PADDING * 2 + NODE_W, ...layout.map((l) => l.x + NODE_W)) + PADDING;
  const canvasH =
    Math.max(PADDING * 2 + NODE_H, ...layout.map((l) => l.y + NODE_H)) + PADDING;

  const svg: SVG = selectSvgElement(id);
  svg.attr('class', 'neuralnet-diagram');

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
    if (!src || !tgt) continue;

    const x1 = src.x + NODE_W / 2;
    const y1 = src.y + NODE_H;
    const x2 = tgt.x + NODE_W / 2;
    const y2 = tgt.y;
    const cy = (y1 + y2) / 2;

    edgeG
      .append('path')
      .attr('class', 'edge')
      .attr('d', `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`)
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
      .attr('ry', 8);

    // Main type label
    g.append('text')
      .attr('x', NODE_W / 2)
      .attr('y', hasSubLabel ? NODE_H / 2 - 8 : NODE_H / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
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
        .text(sub);
    }
  }

  configureSvgSize(svg, canvasH, canvasW, true);
};

export const renderer = { draw };
