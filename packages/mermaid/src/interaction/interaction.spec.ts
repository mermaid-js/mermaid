import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MermaidDragEditor } from './MermaidDragEditor.js';
import { EdgeUpdater } from './EdgeUpdater.js';
import { extractUserNodeId } from './NodeScanner.js';
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
