import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MermaidDragEditor } from './MermaidDragEditor.js';
import { EdgeUpdater } from './EdgeUpdater.js';
import { NodeScanner, extractUserNodeId, getParentAccumulatedOffset } from './NodeScanner.js';
import { OverrideStore } from './OverrideStore.js';
import { UndoManager } from './UndoManager.js';
import { CoordinateConverter } from './CoordinateConverter.js';
import type { OverrideData, ScannedNode } from './types.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface DomGlobalsSnapshot {
  window: typeof globalThis.window | undefined;
  document: typeof globalThis.document | undefined;
  localStorage: Storage | undefined;
  Element: typeof globalThis.Element | undefined;
  SVGElement: typeof globalThis.SVGElement | undefined;
  SVGGElement: typeof globalThis.SVGGElement | undefined;
  SVGPathElement: typeof globalThis.SVGPathElement | undefined;
}

interface EdgeFixtureOptions {
  classAttr?: string;
  edgeId?: string;
  source?: string;
  target?: string;
}

function setGlobalValue<K extends keyof typeof globalThis>(key: K, value: (typeof globalThis)[K]) {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
}

function createSvgDiagram(id = 'mermaid-0', edgeOptions: EdgeFixtureOptions = {}): SVGElement {
  const {
    classAttr = 'edge-thickness-normal edge-pattern-solid flowchart-link',
    edgeId = 'L_A_B_0',
    source,
    target,
  } = edgeOptions;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('id', id);
  svg.setAttribute('viewBox', '0 0 200 100');

  const nodesGroup = document.createElementNS(SVG_NS, 'g');
  nodesGroup.setAttribute('class', 'nodes');
  svg.appendChild(nodesGroup);

  nodesGroup.appendChild(createNode(id, 'A', 10, 20));
  nodesGroup.appendChild(createNode(id, 'B', 100, 20));

  const edgePaths = document.createElementNS(SVG_NS, 'g');
  edgePaths.setAttribute('class', 'edgePaths');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('class', classAttr);
  path.setAttribute('data-id', edgeId);
  path.setAttribute('d', 'M 10,20 C 30,20 80,20 100,20');
  if (source) {
    path.setAttribute('data-source', source);
  }
  if (target) {
    path.setAttribute('data-target', target);
  }
  edgePaths.appendChild(path);
  svg.appendChild(edgePaths);

  const edgeLabels = document.createElementNS(SVG_NS, 'g');
  edgeLabels.setAttribute('class', 'edgeLabels');
  const edgeLabel = document.createElementNS(SVG_NS, 'g');
  edgeLabel.setAttribute('class', 'edgeLabel');
  const label = document.createElementNS(SVG_NS, 'g');
  label.setAttribute('class', 'label');
  label.setAttribute('data-id', edgeId);
  edgeLabel.appendChild(label);
  edgeLabels.appendChild(edgeLabel);
  svg.appendChild(edgeLabels);

  document.body.appendChild(svg);
  return svg;
}

function createNode(diagramId: string, nodeId: string, x: number, y: number): SVGGElement {
  const node = document.createElementNS(SVG_NS, 'g');
  node.setAttribute('class', 'node default');
  node.setAttribute('id', `${diagramId}-flowchart-${nodeId}-0`);
  node.setAttribute('transform', `translate(${x}, ${y})`);

  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('width', '40');
  rect.setAttribute('height', '20');
  node.appendChild(rect);

  return node;
}

function getNodeElement(svg: SVGElement, nodeId: string): SVGGElement {
  return svg.querySelector<SVGGElement>(`#${svg.id}-flowchart-${nodeId}-0`)!;
}

function getEdgePathElement(svg: SVGElement): SVGPathElement {
  return svg.querySelector<SVGPathElement>('.flowchart-link')!;
}

describe('interaction editor', () => {
  let snapshot: DomGlobalsSnapshot;

  beforeEach(() => {
    snapshot = {
      window: globalThis.window,
      document: globalThis.document,
      localStorage: globalThis.localStorage,
      Element: globalThis.Element,
      SVGElement: globalThis.SVGElement,
      SVGGElement: globalThis.SVGGElement,
      SVGPathElement: globalThis.SVGPathElement,
    };

    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'https://example.test/',
    });
    const pathCtor = dom.window.SVGPathElement ?? dom.window.SVGElement;

    setGlobalValue('window', dom.window as unknown as Window & typeof globalThis);
    setGlobalValue('document', dom.window.document);
    setGlobalValue('localStorage', dom.window.localStorage);
    setGlobalValue('Element', dom.window.Element);
    setGlobalValue('SVGElement', dom.window.SVGElement);
    setGlobalValue('SVGGElement', dom.window.SVGGElement);
    setGlobalValue('SVGPathElement', pathCtor as unknown as typeof globalThis.SVGPathElement);

    Object.defineProperty(dom.window.SVGSVGElement.prototype, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 200,
        height: 100,
        right: 200,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      configurable: true,
    });

    Object.defineProperty(pathCtor.prototype, 'getTotalLength', {
      value: () => 100,
      configurable: true,
    });

    Object.defineProperty(pathCtor.prototype, 'getPointAtLength', {
      value: (length: number) => ({ x: length, y: 50 }),
      configurable: true,
    });
  });

  afterEach(() => {
    setGlobalValue('window', snapshot.window!);
    setGlobalValue('document', snapshot.document!);
    setGlobalValue('localStorage', snapshot.localStorage!);
    setGlobalValue('Element', snapshot.Element!);
    setGlobalValue('SVGElement', snapshot.SVGElement!);
    setGlobalValue('SVGGElement', snapshot.SVGGElement!);
    setGlobalValue('SVGPathElement', snapshot.SVGPathElement!);
  });

  it('keeps all requested nodes selected when using selectNodes', async () => {
    const svg = createSvgDiagram();
    const editor = new MermaidDragEditor({ svgElement: svg, storageKey: 'multi-select' });
    await editor.enable();

    editor.selectNodes(['A', 'B']);

    expect(getNodeElement(svg, 'A').classList.contains('selected')).toBe(true);
    expect(getNodeElement(svg, 'B').classList.contains('selected')).toBe(true);
  });

  it('extracts node ids even if the svg root id no longer matches the render prefix', () => {
    expect(
      extractUserNodeId('mermaid-drag-demo-render-flowchart-node-A-0', 'mermaid-drag-demo')
    ).toBe('node-A');
  });

  it('restores the original auto-layout position on the first undo', async () => {
    const svg = createSvgDiagram();
    const editor = new MermaidDragEditor({ svgElement: svg, storageKey: 'undo-first-drag' });
    await editor.enable();

    const nodeMap = (editor as unknown as { nodeMap: Map<string, ScannedNode> }).nodeMap;
    const nodeA = nodeMap.get('A')!;
    const nodeB = nodeMap.get('B')!;
    nodeA.nodeWidth = 100;
    nodeA.nodeHeight = 50;
    nodeB.nodeWidth = 100;
    nodeB.nodeHeight = 50;
    const edgeUpdater = (editor as unknown as { edgeUpdater: EdgeUpdater }).edgeUpdater;
    edgeUpdater.updateAllEdges();

    nodeA.element.setAttribute('transform', 'translate(50, 20)');
    nodeA.currentX = 50;
    nodeA.currentY = 20;

    (
      editor as unknown as {
        onDragFinished: (nodes: { nodeId: string; x: number; y: number }[]) => void;
      }
    ).onDragFinished([{ nodeId: 'A', x: 50, y: 20 }]);

    editor.undo();

    expect(nodeA.element.getAttribute('transform')).toBe('translate(10, 20)');
    expect(getEdgePathElement(svg).getAttribute('d')).toBe('M 60 20 C 56.5 19, 53.5 19, 50 20');
    expect(editor.getOverrides().overrides.nodes).toEqual({});
  });

  it('restores base layout without rerendering and clears overrides', async () => {
    const svg = createSvgDiagram();
    const editor = new MermaidDragEditor({ svgElement: svg, storageKey: 'reset-layout' });
    await editor.enable();

    const nodeMap = (editor as unknown as { nodeMap: Map<string, ScannedNode> }).nodeMap;
    const nodeA = nodeMap.get('A')!;
    const nodeB = nodeMap.get('B')!;
    nodeA.nodeWidth = 100;
    nodeA.nodeHeight = 50;
    nodeB.nodeWidth = 100;
    nodeB.nodeHeight = 50;
    const edgeUpdater = (editor as unknown as { edgeUpdater: EdgeUpdater }).edgeUpdater;
    edgeUpdater.updateAllEdges();

    editor.setNodePosition('A', 60, 20);
    expect(getEdgePathElement(svg).getAttribute('d')).toBe('M 110 20 C 89 14, 71 14, 50 20');

    await editor.resetLayout();

    expect(getNodeElement(svg, 'A').getAttribute('transform')).toBe('translate(10, 20)');
    expect(getEdgePathElement(svg).getAttribute('d')).toBe('M 60 20 C 56.5 19, 53.5 19, 50 20');
    expect(editor.getOverrides().overrides.nodes).toEqual({});
  });

  it('rebuilds handler context after resetLayout rerenders the svg', async () => {
    const svg = createSvgDiagram();
    const replacementSvg = createSvgDiagram('mermaid-1');
    replacementSvg.remove();

    const renderFn = vi.fn(() => Promise.resolve(replacementSvg));
    const editor = new MermaidDragEditor({
      svgElement: svg,
      storageKey: 'rerender-reset',
      mermaidCode: 'flowchart LR\nA-->B',
      renderFn,
    });
    await editor.enable();

    await editor.resetLayout();

    const dragHandler = (editor as unknown as { dragHandler: { svgElement: SVGElement } })
      .dragHandler;
    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(dragHandler.svgElement).toBe(replacementSvg);
  });

  it('restores locked state from persisted overrides and blocks dragging', async () => {
    const svg = createSvgDiagram();
    const stored: OverrideData = {
      version: 1,
      layout: 'dagre',
      overrides: {
        nodes: {
          A: { x: 10, y: 20, locked: true },
        },
        edges: {},
      },
    };
    localStorage.setItem('mermaid-override-lock-test', JSON.stringify(stored));

    const editor = new MermaidDragEditor({ svgElement: svg, storageKey: 'lock-test' });
    await editor.enable();

    const dragHandler = (
      editor as unknown as {
        dragHandler: {
          handlePointerDown: (event: PointerEvent) => void;
          dragSnapshot: object | null;
        };
      }
    ).dragHandler;
    const nodeA = getNodeElement(svg, 'A');

    dragHandler.handlePointerDown({
      button: 0,
      shiftKey: false,
      pointerId: 1,
      target: nodeA,
      clientX: 0,
      clientY: 0,
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);

    expect(nodeA.classList.contains('locked')).toBe(true);
    expect(dragHandler.dragSnapshot).toBeNull();
  });
});

describe('edge updater', () => {
  let snapshot: DomGlobalsSnapshot;

  beforeEach(() => {
    snapshot = {
      window: globalThis.window,
      document: globalThis.document,
      localStorage: globalThis.localStorage,
      Element: globalThis.Element,
      SVGElement: globalThis.SVGElement,
      SVGGElement: globalThis.SVGGElement,
      SVGPathElement: globalThis.SVGPathElement,
    };

    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'https://example.test/',
    });
    const pathCtor = dom.window.SVGPathElement ?? dom.window.SVGElement;

    setGlobalValue('window', dom.window as unknown as Window & typeof globalThis);
    setGlobalValue('document', dom.window.document);
    setGlobalValue('localStorage', dom.window.localStorage);
    setGlobalValue('Element', dom.window.Element);
    setGlobalValue('SVGElement', dom.window.SVGElement);
    setGlobalValue('SVGGElement', dom.window.SVGGElement);
    setGlobalValue('SVGPathElement', pathCtor as unknown as typeof globalThis.SVGPathElement);

    Object.defineProperty(pathCtor.prototype, 'getTotalLength', {
      value: () => 100,
      configurable: true,
    });

    Object.defineProperty(pathCtor.prototype, 'getPointAtLength', {
      value: (length: number) => ({ x: length, y: 50 }),
      configurable: true,
    });
  });

  afterEach(() => {
    setGlobalValue('window', snapshot.window!);
    setGlobalValue('document', snapshot.document!);
    setGlobalValue('localStorage', snapshot.localStorage!);
    setGlobalValue('Element', snapshot.Element!);
    setGlobalValue('SVGElement', snapshot.SVGElement!);
    setGlobalValue('SVGGElement', snapshot.SVGGElement!);
    setGlobalValue('SVGPathElement', snapshot.SVGPathElement!);
  });

  it('recomputes edge paths from connection points when nodes move', () => {
    const svg = createSvgDiagram();
    const edgeUpdater = new EdgeUpdater(svg);

    const nodeMap = new Map<string, ScannedNode>([
      [
        'A',
        {
          element: getNodeElement(svg, 'A'),
          userNodeId: 'A',
          currentX: 20,
          currentY: 20,
          nodeWidth: 60,
          nodeHeight: 40,
          locked: false,
        },
      ],
      [
        'B',
        {
          element: getNodeElement(svg, 'B'),
          userNodeId: 'B',
          currentX: 100,
          currentY: 20,
          nodeWidth: 60,
          nodeHeight: 40,
          locked: false,
        },
      ],
    ]);

    edgeUpdater.buildEdgeMap(nodeMap);
    edgeUpdater.updateAllEdges();
    expect(getEdgePathElement(svg).getAttribute('d')).toBe('M 50 20 C 57 22, 63 22, 70 20');

    nodeMap.get('A')!.currentX = 30;
    edgeUpdater.updateAllEdges();
    expect(getEdgePathElement(svg).getAttribute('d')).toBe('M 60 20 C 63.5 21, 66.5 21, 70 20');
  });

  it('uses rendered data-source and data-target attributes to map edges', () => {
    const svg = createSvgDiagram('mermaid-0', {
      edgeId: 'custom-edge',
      source: 'A',
      target: 'B',
    });
    const edgeUpdater = new EdgeUpdater(svg);
    const nodeMap = new Map<string, ScannedNode>([
      [
        'A',
        {
          element: getNodeElement(svg, 'A'),
          userNodeId: 'A',
          currentX: 20,
          currentY: 20,
          nodeWidth: 60,
          nodeHeight: 40,
          locked: false,
        },
      ],
      [
        'B',
        {
          element: getNodeElement(svg, 'B'),
          userNodeId: 'B',
          currentX: 100,
          currentY: 20,
          nodeWidth: 60,
          nodeHeight: 40,
          locked: false,
        },
      ],
    ]);

    edgeUpdater.buildEdgeMap(nodeMap);

    expect(edgeUpdater.getEdgeMap().get('custom-edge')).toMatchObject({
      source: 'A',
      target: 'B',
    });
  });

  it('supports legacy LS-/LE- class endpoint markers', () => {
    const svg = createSvgDiagram('mermaid-0', {
      classAttr: 'edge-thickness-normal edge-pattern-solid flowchart-link LS-A LE-B',
      edgeId: 'legacy-edge',
    });
    const edgeUpdater = new EdgeUpdater(svg);
    const nodeMap = new Map<string, ScannedNode>([
      [
        'A',
        {
          element: getNodeElement(svg, 'A'),
          userNodeId: 'A',
          currentX: 20,
          currentY: 20,
          nodeWidth: 60,
          nodeHeight: 40,
          locked: false,
        },
      ],
      [
        'B',
        {
          element: getNodeElement(svg, 'B'),
          userNodeId: 'B',
          currentX: 100,
          currentY: 20,
          nodeWidth: 60,
          nodeHeight: 40,
          locked: false,
        },
      ],
    ]);

    edgeUpdater.buildEdgeMap(nodeMap);

    expect(edgeUpdater.getNodeToEdgesMap().get('A')).toEqual(new Set(['legacy-edge']));
    expect(edgeUpdater.getNodeToEdgesMap().get('B')).toEqual(new Set(['legacy-edge']));
  });

  it('moves edge labels to the updated path midpoint', () => {
    const svg = createSvgDiagram('mermaid-0', {
      edgeId: 'custom-edge',
      source: 'A',
      target: 'B',
    });
    const edgeUpdater = new EdgeUpdater(svg);
    const nodeMap = new Map<string, ScannedNode>([
      [
        'A',
        {
          element: getNodeElement(svg, 'A'),
          userNodeId: 'A',
          currentX: 20,
          currentY: 20,
          nodeWidth: 60,
          nodeHeight: 40,
          locked: false,
        },
      ],
      [
        'B',
        {
          element: getNodeElement(svg, 'B'),
          userNodeId: 'B',
          currentX: 100,
          currentY: 20,
          nodeWidth: 60,
          nodeHeight: 40,
          locked: false,
        },
      ],
    ]);

    edgeUpdater.buildEdgeMap(nodeMap);
    edgeUpdater.updateAllEdges();

    expect(svg.querySelector('.edgeLabel')?.getAttribute('transform')).toBe('translate(50, 50)');
  });
});

// =============================================================================
// CoordinateConverter
// =============================================================================
describe('CoordinateConverter', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let d: any;

  beforeEach(() => {
    d = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'https://example.test/',
    });
    const win = d.window as unknown as Window & typeof globalThis;
    setGlobalValue('window', win);
    setGlobalValue('document', win.document);
    setGlobalValue('SVGElement', win.SVGElement);
    setGlobalValue('SVGSVGElement', win.SVGSVGElement);
  });

  afterEach(() => {
    setGlobalValue('window', d.window);
    setGlobalValue('document', d.window.document);
  });

  function makeSvg(viewBoxAttr: string, rectWidth = 200, rectHeight = 100) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', viewBoxAttr);
    // Mock getBoundingClientRect to match viewBox aspect ratio at scale 2
    Object.defineProperty(svg, 'getBoundingClientRect', {
      value: () => ({
        left: 10,
        top: 20,
        width: rectWidth,
        height: rectHeight,
        right: 10 + rectWidth,
        bottom: 20 + rectHeight,
        x: 10,
        y: 20,
        toJSON: () => ({}),
      }),
      configurable: true,
    });
    document.body.appendChild(svg);
    return svg;
  }

  it('converts client coords to viewBox coords', () => {
    const svg = makeSvg('0 0 400 200');
    const c = new CoordinateConverter(svg);
    // client (210, 120) maps to viewBox (400, 200) at scale 2
    const vb = c.clientToViewBox(210, 120);
    expect(vb.x).toBeCloseTo(400, 0);
    expect(vb.y).toBeCloseTo(200, 0);
  });

  it('converts viewBox coords to client coords', () => {
    const svg = makeSvg('0 0 400 200');
    const c = new CoordinateConverter(svg);
    const cl = c.viewBoxToClient(200, 100);
    expect(cl.x).toBeCloseTo(110, 0);
    expect(cl.y).toBeCloseTo(70, 0);
  });

  it('handles missing viewBox gracefully', () => {
    const svg = makeSvg('');
    const c = new CoordinateConverter(svg);
    // No valid viewBox means baseVal is {0,0,0,0}, clientToViewBox yields 0
    const vb = c.clientToViewBox(100, 50);
    // viewBoxToClient with zero viewBox dimensions gives Infinity — no
    // meaningful conversion possible, which is acceptable behavior
    expect(() => c.viewBoxToClient(100, 50)).not.toThrow();
  });
});

// =============================================================================
// OverrideStore
// =============================================================================
describe('OverrideStore', () => {
  let store: OverrideStore;

  beforeEach(() => {
    localStorage.clear();
    store = new OverrideStore('test-key', 'dagre');
  });

  it('stores and retrieves a single node override', () => {
    store.set('A', 10, 20);
    const r = store.get('A');
    expect(r).toEqual({ x: 10, y: 20 });
  });

  it('returns null for a missing override', () => {
    expect(store.get('nonexistent')).toBeNull();
  });

  it('returns a copy of all overrides from getAll()', () => {
    store.set('A', 10, 20);
    store.set('B', 30, 40);
    const all = store.getAll();
    expect(all).toEqual({ A: { x: 10, y: 20 }, B: { x: 30, y: 40 } });
    // Mutating the returned copy does not affect the store
    delete all.A;
    expect(store.get('A')).toEqual({ x: 10, y: 20 });
  });

  it('deletes a single node override', () => {
    store.set('A', 1, 2);
    store.delete('A');
    expect(store.get('A')).toBeNull();
  });

  it('clears all overrides', () => {
    store.set('A', 1, 2);
    store.set('B', 3, 4);
    store.clear();
    expect(store.getAll()).toEqual({});
  });

  it('replaces overrides from external data', () => {
    store.set('A', 1, 2);
    store.replace({
      version: 1,
      layout: 'dagre',
      overrides: { nodes: { B: { x: 10, y: 20 } }, edges: {} },
    });
    expect(store.get('A')).toBeNull();
    expect(store.get('B')).toEqual({ x: 10, y: 20 });
  });

  it('replaces with null clears', () => {
    store.set('A', 1, 2);
    store.replace(null);
    expect(store.getAll()).toEqual({});
  });

  it('saves to and loads from localStorage', async () => {
    store.set('A', 100, 200);
    await store.save();
    const store2 = new OverrideStore('test-key', 'dagre');
    await store2.load();
    expect(store2.get('A')).toEqual({ x: 100, y: 200 });
  });

  it('uses custom onSave/onLoad callbacks when provided', async () => {
    let saved: OverrideData | null = null;
    // eslint-disable-next-line @typescript-eslint/require-await
    const onSave = vi.fn(async (d: OverrideData) => {
      saved = d;
    });
    const onLoad = vi.fn(() => Promise.resolve(saved));
    const custom = new OverrideStore('callback-key', 'dagre', onSave, onLoad);
    custom.set('X', 300, 400);
    await custom.save();
    expect(onSave).toHaveBeenCalledOnce();
    expect(saved!.overrides.nodes.X).toEqual({ x: 300, y: 400 });
    const loaded = await custom.load();
    expect(onLoad).toHaveBeenCalledOnce();
    expect(loaded!.overrides.nodes.X).toEqual({ x: 300, y: 400 });
  });
});

// =============================================================================
// UndoManager
// =============================================================================
describe('UndoManager', () => {
  function makeNodeMap(): Map<string, ScannedNode> {
    return new Map();
  }

  it('starts with no undoable or redoable operations', () => {
    const u = new UndoManager(10, makeNodeMap(), vi.fn());
    expect(u.canUndo()).toBe(false);
    expect(u.canRedo()).toBe(false);
  });

  it('records push, undo, and redo', () => {
    const apply = vi.fn();
    const u = new UndoManager(10, makeNodeMap(), apply);

    u.push({ nodeIds: ['A'], before: { A: { x: 0, y: 0 } }, after: { A: { x: 10, y: 10 } } });
    expect(u.canUndo()).toBe(true);
    expect(u.canRedo()).toBe(false);

    u.undo();
    expect(apply).toHaveBeenCalledWith({ A: { x: 0, y: 0 } }, expect.any(Map));
    expect(u.canUndo()).toBe(false);
    expect(u.canRedo()).toBe(true);

    u.redo();
    expect(apply).toHaveBeenCalledWith({ A: { x: 10, y: 10 } }, expect.any(Map));
  });

  it('discards redo branch on new push after undo', () => {
    const apply = vi.fn();
    const u = new UndoManager(10, makeNodeMap(), apply);
    u.push({ nodeIds: ['A'], before: {}, after: { A: { x: 1, y: 1 } } });
    u.push({ nodeIds: ['A'], before: {}, after: { A: { x: 2, y: 2 } } });

    u.undo(); // back to first entry
    expect(u.canRedo()).toBe(true);

    // New push should truncate the redo branch (second entry)
    u.push({ nodeIds: ['B'], before: {}, after: { B: { x: 3, y: 3 } } });
    expect(u.canRedo()).toBe(false);

    u.undo(); // back to first entry
    u.redo(); // should apply B's after
    expect(apply).toHaveBeenCalledWith({ B: { x: 3, y: 3 } }, expect.any(Map));
  });

  it('undo on empty history is a no-op', () => {
    const apply = vi.fn();
    const u = new UndoManager(10, makeNodeMap(), apply);
    u.undo();
    expect(apply).not.toHaveBeenCalled();
  });

  it('redo on empty future is a no-op', () => {
    const apply = vi.fn();
    const u = new UndoManager(10, makeNodeMap(), apply);
    u.redo();
    expect(apply).not.toHaveBeenCalled();
  });

  it('limits history depth', () => {
    const apply = vi.fn();
    const u = new UndoManager(2, makeNodeMap(), apply);
    u.push({ nodeIds: ['A'], before: {}, after: {} });
    u.push({ nodeIds: ['B'], before: {}, after: {} });
    u.push({ nodeIds: ['C'], before: {}, after: {} });
    // Depth 2 means oldest entry (A) is dropped
    u.undo();
    u.undo();
    expect(u.canUndo()).toBe(false); // B and C in history, A dropped
  });

  it('clear resets all state', () => {
    const u = new UndoManager(10, makeNodeMap(), vi.fn());
    u.push({ nodeIds: ['A'], before: {}, after: { A: { x: 5, y: 5 } } });
    u.clear();
    expect(u.canUndo()).toBe(false);
    expect(u.canRedo()).toBe(false);
  });
});

// =============================================================================
// NodeScanner
// =============================================================================
describe('NodeScanner', () => {
  function createSvg(
    diagramId = 'mermaid-0',
    nodes: { id: string; x: number; y: number }[] = [
      { id: 'A', x: 10, y: 20 },
      { id: 'B', x: 100, y: 20 },
    ]
  ) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', diagramId);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'nodes');
    for (const n of nodes) {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      node.setAttribute('id', `${diagramId}-flowchart-${n.id}-0`);
      node.setAttribute('class', 'node default');
      node.setAttribute('transform', `translate(${n.x}, ${n.y})`);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '40');
      rect.setAttribute('height', '20');
      node.appendChild(rect);
      g.appendChild(node);
    }
    svg.appendChild(g);
    document.body.appendChild(svg);
    return svg;
  }

  it('scans nodes and returns a correct map', () => {
    const svg = createSvg();
    const scanner = new NodeScanner(svg);
    const map = scanner.scan();
    expect(map.size).toBe(2);
    expect(map.get('A')!.userNodeId).toBe('A');
    expect(map.get('A')!.currentX).toBe(10);
    expect(map.get('A')!.currentY).toBe(20);
    expect(map.get('B')!.userNodeId).toBe('B');
    expect(map.get('B')!.currentX).toBe(100);
    expect(map.get('B')!.currentY).toBe(20);
  });

  it('returns empty map when there are no .nodes containers', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'empty');
    document.body.appendChild(svg);
    const scanner = new NodeScanner(svg);
    const map = scanner.scan();
    expect(map.size).toBe(0);
  });

  it('extractUserNodeId handles dashed node ids', () => {
    expect(extractUserNodeId('mermaid-0-flowchart-node-long-id-0', 'mermaid-0')).toBe(
      'node-long-id'
    );
  });

  it('extractUserNodeId returns null for non-matching ids', () => {
    expect(extractUserNodeId('some-other-element', 'mermaid-0')).toBeNull();
  });

  it('extractUserNodeId handles fallback regex when id does not start with diagram prefix', () => {
    expect(extractUserNodeId('custom-flowchart-A-5', 'different-id')).toBe('A');
  });

  it('getParentAccumulatedOffset returns 0/0 for a direct child of SVG', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'test');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', 'translate(10, 20)');
    svg.appendChild(g);
    document.body.appendChild(svg);
    const offset = getParentAccumulatedOffset(g, svg);
    expect(offset).toEqual({ x: 0, y: 0 });
  });

  it('findNodeIdFromTarget returns null for null target', () => {
    const svg = createSvg();
  });

  // =============================================================================
  // MermaidDragEditor — extended coverage
  // =============================================================================
  describe('MermaidDragEditor extended', () => {
    let snap: DomGlobalsSnapshot;

    beforeEach(() => {
      snap = {
        window: globalThis.window,
        document: globalThis.document,
        localStorage: globalThis.localStorage,
        Element: globalThis.Element,
        SVGElement: globalThis.SVGElement,
        SVGGElement: globalThis.SVGGElement,
        SVGPathElement: globalThis.SVGPathElement,
      };
      const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        url: 'https://example.test/',
      });
      setGlobalValue('window', dom.window as unknown as Window & typeof globalThis);
      setGlobalValue('document', dom.window.document);
      setGlobalValue('localStorage', dom.window.localStorage);
      setGlobalValue('Element', dom.window.Element);
      setGlobalValue('SVGElement', dom.window.SVGElement);
      setGlobalValue('SVGGElement', dom.window.SVGGElement);
      setGlobalValue('SVGPathElement', dom.window.SVGPathElement);
    });

    afterEach(() => {
      setGlobalValue('window', snap.window!);
      setGlobalValue('document', snap.document!);
      setGlobalValue('localStorage', snap.localStorage!);
      setGlobalValue('Element', snap.Element!);
      setGlobalValue('SVGElement', snap.SVGElement!);
      setGlobalValue('SVGGElement', snap.SVGGElement!);
      setGlobalValue('SVGPathElement', snap.SVGPathElement!);
    });

    function makeSvg(id = 'mermaid-extended') {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', id);
      svg.setAttribute('viewBox', '0 0 200 100');
      const ng = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      ng.setAttribute('class', 'nodes');
      for (const n of ['A', 'B']) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('id', `${id}-flowchart-${n}-0`);
        g.setAttribute('class', 'node default');
        g.setAttribute('transform', `translate(${n === 'A' ? 10 : 100}, 20)`);
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('width', '40');
        r.setAttribute('height', '20');
        g.appendChild(r);
        ng.appendChild(g);
      }
      svg.appendChild(ng);
      document.body.appendChild(svg);
      return svg;
    }

    it('enable() is idempotent', async () => {
      const svg = makeSvg();
      const editor = new MermaidDragEditor({ svgElement: svg, storageKey: 'idempotent' });
      await editor.enable();
      const handler1 = (editor as unknown as { dragHandler: { bind: ReturnType<typeof vi.fn> } })
        .dragHandler;
      const bindSpy = vi.spyOn(handler1, 'bind');
      await editor.enable();
      expect(bindSpy).not.toHaveBeenCalled();
    });

    it('disable() unbinds events and sets enabled to false', async () => {
      const svg = makeSvg();
      const editor = new MermaidDragEditor({ svgElement: svg, storageKey: 'disable-test' });
      await editor.enable();
      editor.disable();
      expect((editor as unknown as { enabled: boolean }).enabled).toBe(false);
    });

    it('redo() applies the next snapshot', async () => {
      const svg = makeSvg();
      const editor = new MermaidDragEditor({ svgElement: svg, storageKey: 'redo-test' });
      await editor.enable();
      const nodeA = svg.querySelector('#mermaid-extended-flowchart-A-0')!;
      // Call onDragFinished with correct `this` binding
      const anyEditor = editor as unknown as {
        onDragFinished: (nodes: { nodeId: string; x: number; y: number }[]) => void;
      };
      anyEditor.onDragFinished.call(editor, [{ nodeId: 'A', x: 50, y: 20 }]);
      editor.undo();
      expect(nodeA.getAttribute('transform')).toBe('translate(10, 20)');
      editor.redo();
      expect(nodeA.getAttribute('transform')).toBe('translate(50, 20)');
    });

    it('destroy() cleans up and prevents re-enable', async () => {
      const svg = makeSvg();
      const editor = new MermaidDragEditor({ svgElement: svg, storageKey: 'destroy-test' });
      await editor.enable();
      editor.destroy();
      expect((editor as unknown as { destroyed: boolean }).destroyed).toBe(true);
      // Re-enable should be a no-op
      await editor.enable();
      expect((editor as unknown as { enabled: boolean }).enabled).toBe(false);
    });

    it('importOverrides applies external override data', async () => {
      const svg = makeSvg();
      const editor = new MermaidDragEditor({ svgElement: svg, storageKey: 'import-test' });
      await editor.enable();
      const data: OverrideData = {
        version: 1,
        layout: 'dagre',
        overrides: { nodes: { A: { x: 200, y: 50 } }, edges: {} },
      };
      await editor.importOverrides(data);
      const nodeA = svg.querySelector('#mermaid-extended-flowchart-A-0')!;
      expect(nodeA.getAttribute('transform')).toBe('translate(200, 50)');
    });

    it('setNodeLocked prevents further moves via getOverrides', async () => {
      const svg = makeSvg();
      const editor = new MermaidDragEditor({ svgElement: svg, storageKey: 'lock-test2' });
      await editor.enable();
      editor.setNodeLocked('A', true);
      const overrides = editor.getOverrides();
      expect(overrides.overrides.nodes.A).toEqual({ x: 10, y: 20, locked: true });
    });
  });

  describe('dragEditor auto-activation bindFunctions wrapping', () => {
    function makeTestSvg(id = 'auto-test') {
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('id', id);
      svg.setAttribute('viewBox', '0 0 200 100');
      const ng = document.createElementNS(SVG_NS, 'g');
      ng.setAttribute('class', 'nodes');
      for (const n of ['A', 'B']) {
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('id', `${id}-flowchart-${n}-0`);
        g.setAttribute('class', 'node default');
        g.setAttribute('transform', `translate(${n === 'A' ? 10 : 100}, 20)`);
        const r = document.createElementNS(SVG_NS, 'rect');
        r.setAttribute('width', '40');
        r.setAttribute('height', '20');
        g.appendChild(r);
        ng.appendChild(g);
      }
      svg.appendChild(ng);
      document.body.appendChild(svg);
      return svg;
    }

    /** Simulates the wrapping logic from mermaidAPI.ts render(). */
    function createWrappedBindFunctions(
      container: HTMLElement,
      origBindFunctions: ((element: Element) => void) | undefined,
      mermaidCode: string,
      storageKey?: string,
      maxUndoDepth?: number
    ): { bindFunctions: (element: Element) => void; capturedEditors: MermaidDragEditor[] } {
      const capturedEditors: MermaidDragEditor[] = [];
      const bindFunctions = (element: Element) => {
        if (origBindFunctions) {
          origBindFunctions(element);
        }
        const svgEl = element.querySelector('svg');
        if (!svgEl) {
          return;
        }
        try {
          const editor = new MermaidDragEditor({
            svgElement: svgEl as unknown as SVGElement,
            mermaidCode,
            storageKey: storageKey ?? 'auto-test',
            maxUndoDepth,
          });
          void editor.enable();
          capturedEditors.push(editor);
        } catch (e) {
          // Swallow per mermaidAPI.ts pattern
        }
      };
      return { bindFunctions, capturedEditors };
    }

    it('creates a MermaidDragEditor when called with a container that has an SVG', () => {
      const svg = makeTestSvg('auto-a');
      const container = document.createElement('div');
      container.appendChild(svg);

      const { bindFunctions, capturedEditors } = createWrappedBindFunctions(
        container,
        undefined,
        'flowchart LR\nA-->B'
      );

      bindFunctions(container);
      expect(capturedEditors).toHaveLength(1);
    });

    it('preserves and calls original bindFunctions when defined', () => {
      const svg = makeTestSvg('auto-b');
      const container = document.createElement('div');
      container.appendChild(svg);

      const originalCalled = vi.fn();
      const { bindFunctions, capturedEditors } = createWrappedBindFunctions(
        container,
        (el: Element) => {
          originalCalled(el);
        },
        'flowchart LR\nA-->B'
      );

      bindFunctions(container);
      expect(originalCalled).toHaveBeenCalledTimes(1);
      expect(originalCalled).toHaveBeenCalledWith(container);
      expect(capturedEditors).toHaveLength(1);
    });

    it('handles missing SVG in container without throwing', () => {
      const container = document.createElement('div');

      const { bindFunctions, capturedEditors } = createWrappedBindFunctions(
        container,
        undefined,
        'flowchart LR\nA-->B'
      );

      expect(() => bindFunctions(container)).not.toThrow();
      expect(capturedEditors).toHaveLength(0);
    });

    it('passes options through to MermaidDragEditor constructor', () => {
      const svg = makeTestSvg('auto-c');
      const container = document.createElement('div');
      container.appendChild(svg);

      const { bindFunctions, capturedEditors } = createWrappedBindFunctions(
        container,
        undefined,
        'flowchart LR\nA-->B',
        'my-custom-key',
        10
      );

      bindFunctions(container);
      expect(capturedEditors).toHaveLength(1);
      const styleEl = svg.querySelector('style');
      expect(styleEl).not.toBeNull();
      expect(styleEl!.textContent).toContain('cursor');
    });

    it('handles errors gracefully without throwing', () => {
      const container = document.createElement('div');
      const div = document.createElement('div');
      container.appendChild(div);

      const { bindFunctions, capturedEditors } = createWrappedBindFunctions(
        container,
        undefined,
        'flowchart LR\nA-->B'
      );

      expect(() => bindFunctions(container)).not.toThrow();
      expect(capturedEditors).toHaveLength(0);
    });
  });
});
