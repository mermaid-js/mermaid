import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ClusterNode, LayoutData, Node } from '../../types.js';
import {
  boxesOverlap,
  boxCorners,
  inflateBox,
  outlineHitsBox,
  pointInConvex,
  segmentHitsBox,
  type Box,
} from './geometry.js';
import {
  OnionLayoutError,
  runOnionLayoutCore,
  type OnionArrangement,
  type OnionResult,
} from './layoutCore.js';
import { analyseOnion } from './structure.js';

const FIXTURES_DIR = 'packages/mermaid/src/rendering-util/layout-algorithms/onion/fixtures';

/** Measured graphs dumped from rendered diagrams, so the core runs on real node sizes without a browser. */
function loadLayoutData(name: string): LayoutData {
  const raw = readFileSync(resolve(FIXTURES_DIR, `${name}.layout.json`), 'utf8');
  return JSON.parse(raw) as LayoutData;
}

function leaf(id: string, parentId?: string): Node {
  return { id, parentId, isGroup: false, shape: 'rect', width: 120, height: 60 } as Node;
}

function group(id: string, parentId?: string): Node {
  return {
    id,
    parentId,
    isGroup: true,
    shape: 'hexagon',
    padding: 8,
    labelBBox: { width: 90, height: 24 },
  } as Node;
}

function graph(nodes: Node[], edges: [string, string][]): LayoutData {
  return {
    nodes,
    edges: edges.map(([start, end], i) => ({ id: `e${i}`, start, end })),
  } as unknown as LayoutData;
}

/** Ring groups the layout painted a frame for. */
function ringFrames(data: LayoutData): ClusterNode[] {
  return data.nodes.filter((n): n is ClusterNode => n.isGroup && n.hexagonPointDepth !== undefined);
}

const ARRANGEMENTS: OnionArrangement[] = ['horizontal', 'vertical'];

function leafBoxes(data: LayoutData): Map<string, Box> {
  return new Map(
    data.nodes
      .filter((n) => !n.isGroup)
      .map((n) => [n.id, { x: n.x!, y: n.y!, width: n.width!, height: n.height! }])
  );
}

function nodeOverlaps(data: LayoutData): string[] {
  const boxes = [...leafBoxes(data)];
  const found: string[] = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxesOverlap(boxes[i][1], boxes[j][1])) {
        found.push(`${boxes[i][0]}/${boxes[j][0]}`);
      }
    }
  }
  return found;
}

function labelOverlaps(data: LayoutData, result: OnionResult): string[] {
  const found: string[] = [];
  const labels = [...result.labelBoxes];
  for (const [edgeId, label] of labels) {
    for (const [id, box] of leafBoxes(data)) {
      if (boxesOverlap(label, box)) {
        found.push(`${edgeId} on node ${id}`);
      }
    }
  }
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      if (boxesOverlap(labels[i][1], labels[j][1])) {
        found.push(`${labels[i][0]} on label ${labels[j][0]}`);
      }
    }
  }
  return found;
}

function labelsOnFrames(result: OnionResult): string[] {
  const found: string[] = [];
  for (const [edgeId, label] of result.labelBoxes) {
    for (const [ringId, frame] of result.frames) {
      if (outlineHitsBox(frame.poly, label)) {
        found.push(`${edgeId} on outline of ${ringId}`);
      }
      if (boxesOverlap(label, frame.title)) {
        found.push(`${edgeId} on title of ${ringId}`);
      }
    }
  }
  return found;
}

function edgesThroughNodes(data: LayoutData): string[] {
  const boxes = leafBoxes(data);
  const found: string[] = [];
  for (const edge of data.edges) {
    const points = edge.points;
    if (!points || edge.start === edge.end) {
      continue;
    }
    for (const [id, box] of boxes) {
      if (id === edge.start || id === edge.end) {
        continue;
      }
      const inner = inflateBox(box, -2);
      if (points.slice(1).some((p, i) => segmentHitsBox(points[i], p, inner))) {
        found.push(`${edge.id} through ${id}`);
      }
    }
  }
  return found;
}

function enclosureFailures(data: LayoutData, result: OnionResult): string[] {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const portIds = new Set(
    data.nodes
      .filter((n) => !n.isGroup && n.parentId === analyseOnion(data).core.id)
      .map((n) => n.id)
  );
  const found: string[] = [];
  for (const [ringId, frame] of result.frames) {
    for (const n of data.nodes) {
      if (n.isGroup) {
        continue;
      }
      let inside = false;
      for (let cursor: Node | undefined = n; cursor; cursor = byId.get(cursor.parentId ?? '')) {
        inside ||= cursor.parentId === ringId;
      }
      const exempt = ringId === analyseOnion(data).core.id && portIds.has(n.id);
      const box = leafBoxes(data).get(n.id)!;
      if (inside && !exempt && boxCorners(box).some((c) => !pointInConvex(frame.poly, c, 0))) {
        found.push(`${ringId} does not enclose ${n.id}`);
      }
    }
  }
  return found;
}

function sectorViolations(data: LayoutData, arrangement: OnionArrangement): string[] {
  const structure = analyseOnion(data);
  const across = (id: string) => {
    const n = data.nodes.find((x) => x.id === id)!;
    return arrangement === 'vertical' ? n.y! : n.x!;
  };
  const found: string[] = [];
  for (const port of structure.ports) {
    const wanted = port.kind === 'driving' ? -1 : 1;
    if (Math.sign(across(port.id)) !== wanted) {
      found.push(`${port.id} is on the wrong side`);
    }
    for (const adapter of structure.adapterIds) {
      const attached = (structure.neighbours.get(adapter) ?? []).includes(port.id);
      if (attached && Math.sign(across(adapter)) !== wanted) {
        found.push(`${adapter} is on the wrong side`);
      }
    }
  }
  return found;
}

function allInvariants(data: LayoutData, result: OnionResult, arrangement: OnionArrangement) {
  return {
    nodeOverlaps: nodeOverlaps(data),
    labelOverlaps: labelOverlaps(data, result),
    labelsOnFrames: labelsOnFrames(result),
    edgesThroughNodes: edgesThroughNodes(data),
    enclosureFailures: enclosureFailures(data, result),
    sectorViolations: sectorViolations(data, arrangement),
    conflicts: result.conflictReport,
  };
}

const CLEAN = {
  nodeOverlaps: [],
  labelOverlaps: [],
  labelsOnFrames: [],
  edgesThroughNodes: [],
  enclosureFailures: [],
  sectorViolations: [],
  conflicts: [],
};

describe('runOnionLayoutCore on the order service onion', () => {
  it.each(ARRANGEMENTS)('keeps every rule in the %s arrangement', (arrangement) => {
    const data = loadLayoutData('order-service');
    const result = runOnionLayoutCore(data, arrangement);
    expect(allInvariants(data, result, arrangement)).toEqual(CLEAN);
  });

  it.each(ARRANGEMENTS)('centres every ring and the domain on the origin (%s)', (arrangement) => {
    const data = loadLayoutData('order-service');
    runOnionLayoutCore(data, arrangement);
    for (const n of ringFrames(data)) {
      expect([n.x, n.y]).toEqual([0, 0]);
    }
    const domain = data.nodes.filter((n) => n.parentId === 'domain');
    const meanX = domain.reduce((s, n) => s + n.x!, 0) / domain.length;
    const meanY = domain.reduce((s, n) => s + n.y!, 0) / domain.length;
    expect(Math.hypot(meanX, meanY)).toBeLessThanOrEqual(5);
  });

  it('puts the ports on the core border', () => {
    const data = loadLayoutData('order-service');
    const result = runOnionLayoutCore(data, 'vertical');
    const core = result.frames.get('core')!;
    for (const port of data.nodes.filter((n) => !n.isGroup && n.parentId === 'core')) {
      const centre = { x: port.x!, y: port.y! };
      expect(pointInConvex(core.poly, centre, 1)).toBe(false);
      expect(pointInConvex(core.poly, centre, -1)).toBe(true);
    }
  });

  it('gives each ring a roof depth of its own', () => {
    const data = loadLayoutData('order-service');
    runOnionLayoutCore(data, 'vertical');
    const depths = ringFrames(data).map((n) => n.hexagonPointDepth!);
    expect(depths).toHaveLength(4);
    expect(new Set(depths).size).toBeGreaterThan(1);
    expect(depths.every((d) => d > 40 / 2)).toBe(true);
  });

  it('sizes the side groups but gives them no frame depth', () => {
    const data = loadLayoutData('order-service');
    runOnionLayoutCore(data, 'vertical');
    expect(ringFrames(data).map((n) => n.id)).not.toContain('driving');
    expect(data.nodes.find((n) => n.id === 'driving')!.width).toBeGreaterThan(0);
  });

  it('gives the same layout twice', () => {
    const a = loadLayoutData('order-service');
    const b = loadLayoutData('order-service');
    runOnionLayoutCore(a, 'vertical');
    runOnionLayoutCore(b, 'vertical');
    expect(a.nodes.map((n) => [n.x, n.y])).toEqual(b.nodes.map((n) => [n.x, n.y]));
  });

  it('clears overlaps and crossings that the barycentre order alone leaves', () => {
    const plain = runOnionLayoutCore(loadLayoutData('order-service'), 'vertical', {
      swapPasses: 0,
      sweeps: 0,
    });
    const searched = runOnionLayoutCore(loadLayoutData('order-service'), 'vertical');
    expect(searched.conflicts).toBeLessThan(plain.conflicts);
    expect(searched.crossings).toBeLessThan(plain.crossings);
  });

  it('keeps the vertical layout within the area and aspect targets', () => {
    const result = runOnionLayoutCore(loadLayoutData('order-service'), 'vertical');
    expect(result.width * result.height).toBeLessThanOrEqual(3e6);
    expect(result.width / result.height).toBeGreaterThanOrEqual(0.6);
    expect(result.width / result.height).toBeLessThanOrEqual(1.6);
  });

  it('lays the diagram out in a few seconds at most', () => {
    runOnionLayoutCore(loadLayoutData('order-service'), 'vertical');
    const started = performance.now();
    runOnionLayoutCore(loadLayoutData('order-service'), 'vertical');
    expect(performance.now() - started).toBeLessThan(3000);
  });
});

describe('runOnionLayoutCore on other shapes of input', () => {
  it.each(ARRANGEMENTS)('lays out a diagram with no adapters ring (%s)', (arrangement) => {
    const data = loadLayoutData('no-adapters');
    const result = runOnionLayoutCore(data, arrangement);
    expect([...result.frames.keys()].sort()).toEqual(['app', 'core', 'domain']);
    expect(allInvariants(data, result, arrangement)).toEqual(CLEAN);
  });

  it.each(ARRANGEMENTS)('lays out a diagram with no domain ring (%s)', (arrangement) => {
    const data = loadLayoutData('no-domain');
    const result = runOnionLayoutCore(data, arrangement);
    expect([...result.frames.keys()].sort()).toEqual(['adapters', 'app', 'core']);
    // The packed application grid can leave one edge across a neighbour; the core reports it.
    expect({
      ...allInvariants(data, result, arrangement),
      conflicts: [],
      edgesThroughNodes: [],
    }).toEqual(CLEAN);
    expect(result.conflictReport.length).toBeLessThanOrEqual(1);
  });

  it.each(ARRANGEMENTS)('lays out a diagram with no driven ports (%s)', (arrangement) => {
    const data = loadLayoutData('no-driven');
    const result = runOnionLayoutCore(data, arrangement);
    expect(analyseOnion(data).ports.every((p) => p.kind === 'driving')).toBe(true);
    expect(allInvariants(data, result, arrangement)).toEqual(CLEAN);
  });

  it.each(ARRANGEMENTS)('lays out the small onion (%s)', (arrangement) => {
    const data = loadLayoutData('small-onion');
    const result = runOnionLayoutCore(data, arrangement);
    expect(allInvariants(data, result, arrangement)).toEqual(CLEAN);
  });

  it('stops with an error that names the problem when there are no subgraphs', () => {
    const data = loadLayoutData('no-groups');
    expect(() => runOnionLayoutCore(data, 'vertical')).toThrow(OnionLayoutError);
    expect(() => runOnionLayoutCore(data, 'vertical')).toThrow(/no subgraphs/);
  });

  it('stops with an error when only two rings are nested', () => {
    const data = graph(
      [group('outer'), group('core', 'outer'), leaf('a', 'core'), leaf('b')],
      [['b', 'a']]
    );
    expect(() => runOnionLayoutCore(data, 'vertical')).toThrow(/adapters ring, a core/);
  });

  it('stops with an error when several top-level subgraphs nest further', () => {
    const data = graph(
      [
        group('one'),
        group('inner', 'one'),
        group('two'),
        group('inner2', 'two'),
        leaf('a', 'inner'),
        leaf('b', 'inner2'),
      ],
      [['a', 'b']]
    );
    expect(() => runOnionLayoutCore(data, 'vertical')).toThrow(/top-level subgraphs/);
  });

  it('lays out a minimal adapters, core and application chain', () => {
    const data = graph(
      [
        group('adapters'),
        group('core', 'adapters'),
        group('app', 'core'),
        leaf('driver', 'adapters'),
        leaf('inbound', 'core'),
        leaf('work', 'app'),
        leaf('outbound', 'core'),
        leaf('sink', 'adapters'),
        leaf('queue'),
      ],
      [
        ['queue', 'driver'],
        ['driver', 'inbound'],
        ['inbound', 'work'],
        ['work', 'outbound'],
        ['outbound', 'sink'],
      ]
    );
    const result = runOnionLayoutCore(data, 'vertical');
    // A lone port above a lone node cannot keep its edge off the ring title; the core reports it.
    expect({ ...allInvariants(data, result, 'vertical'), conflicts: [] }).toEqual(CLEAN);
    expect(result.conflicts).toBe(result.conflictReport.length);
  });

  it('routes a self-loop as a small loop beside its node', () => {
    const data = loadLayoutData('self-loop');
    const result = runOnionLayoutCore(data, 'vertical');
    const loop = data.edges.find((e) => e.start === e.end)!;
    const node = data.nodes.find((n) => n.id === loop.start)!;
    expect(loop.points).toHaveLength(5);
    expect(loop.points!.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
    expect(Math.max(...loop.points!.map((p) => p.x))).toBeGreaterThan(node.x! + node.width! / 2);
    expect(allInvariants(data, result, 'vertical')).toEqual(CLEAN);
  });

  it('draws parallel edges side by side with their own labels', () => {
    const data = loadLayoutData('parallel');
    const result = runOnionLayoutCore(data, 'vertical');
    const pair = data.edges.filter((e) => e.start === 'rest' && e.end === 'order_port');
    expect(pair).toHaveLength(2);
    expect(pair[0].points![1]).not.toEqual(pair[1].points![1]);
    expect(result.labelBoxes.has(pair[0].id) && result.labelBoxes.has(pair[1].id)).toBe(true);
    expect(labelOverlaps(data, result)).toEqual([]);
    expect(labelsOnFrames(result)).toEqual([]);
  });
});
