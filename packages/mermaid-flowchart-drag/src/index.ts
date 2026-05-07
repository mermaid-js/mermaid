/**
 * FlowchartDrag — a standalone drag-and-drop plugin for mermaid flowcharts.
 *
 * Works on the *rendered* SVG DOM, not mermaid internals, so it can be
 * attached to any flowchart SVG without modifying the main library.
 *
 * Usage:
 * ```ts
 * import { FlowchartDrag } from '@mermaid-js/mermaid-flowchart-drag';
 *
 * const svg = document.querySelector('#my-flowchart svg');
 * const drag = new FlowchartDrag(svg);
 * drag.enable();
 * ```
 */

import { type Rect, updateEdgePath, positionEdgeLabel } from './edge-path.js';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NodePosition {
  x: number;
  y: number;
}

export interface FlowchartDragOptions {
  /**
   * Listen for Ctrl+Z / Ctrl+Shift+Z for undo / redo. (default: true)
   */
  enableKeyboardUndo?: boolean;
  /**
   * Maximum number of undo steps. (default: 50)
   */
  maxUndoStack?: number;
  /**
   * Expand the SVG viewBox on first render so there is room to drag
   * nodes beyond the original layout bounds. (default: true)
   */
  expandViewBox?: boolean;
  /**
   * Padding (in viewBox units) added when expanding the viewBox. (default: 80)
   */
  viewBoxPadding?: number;
}

/** Callbacks invoked during drag. */
export interface DragCallbacks {
  onDragStart?: (nodeId: string, pos: NodePosition) => void;
  onDrag?: (nodeId: string, pos: NodePosition) => void;
  onDragEnd?: (nodeId: string, pos: NodePosition) => void;
}

export type FlowchartDragConfig = FlowchartDragOptions & DragCallbacks;

/* ------------------------------------------------------------------ */
/*  Internal data types                                                */
/* ------------------------------------------------------------------ */

interface NodeData {
  element: SVGGElement;
  x: number;
  y: number;
  bbox: DOMRect;
}

interface EdgeData {
  element: SVGPathElement;
  source: string;
  target: string;
  labelEl: SVGGElement | null;
}

interface DragSnapshot {
  nodes: Record<string, NodePosition>;
  edges: Record<string, string>;
}

interface DragState {
  nodeId: string;
  startPointerX: number;
  startPointerY: number;
  startNodeX: number;
  startNodeY: number;
  connectedEdges: EdgeData[];
  undoSnapshot: DragSnapshot;
}

/* ------------------------------------------------------------------ */
/*  Plugin class                                                       */
/* ------------------------------------------------------------------ */

export class FlowchartDrag {
  private svg: SVGSVGElement;

  private nodeMap = new Map<string, NodeData>();
  private edgeMap = new Map<string, EdgeData>();

  private dragState: DragState | null = null;
  private dragActive = false;

  private undoStack: DragSnapshot[] = [];
  private redoStack: DragSnapshot[] = [];

  private boundPointerDown = this.onPointerDown.bind(this);
  private boundPointerMove = this.onPointerMove.bind(this);
  private boundPointerUp = this.onPointerUp.bind(this);
  private boundKeyDown = this.onKeyDown.bind(this);

  private enabled = false;
  private destroyed = false;

  /** User-provided options merged with defaults. */
  readonly options: Required<FlowchartDragOptions>;
  readonly callbacks: DragCallbacks;

  constructor(svgElement: SVGSVGElement, config?: FlowchartDragConfig) {
    this.svg = svgElement;

    this.options = {
      enableKeyboardUndo: config?.enableKeyboardUndo ?? true,
      maxUndoStack: config?.maxUndoStack ?? 50,
      expandViewBox: config?.expandViewBox ?? true,
      viewBoxPadding: config?.viewBoxPadding ?? 80,
    };

    this.callbacks = {
      onDragStart: config?.onDragStart,
      onDrag: config?.onDrag,
      onDragEnd: config?.onDragEnd,
    };

    this.buildMaps();

    if (this.options.expandViewBox) {
      this.expandViewBox();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  /** Enable node dragging. */
  enable(): void {
    if (this.enabled || this.destroyed) {
      return;
    }
    this.enabled = true;

    const nodes = this.svg.querySelectorAll<SVGGElement>('g.node');
    for (const g of nodes) {
      g.style.cursor = 'grab';
      g.addEventListener('pointerdown', this.boundPointerDown);
    }

    this.svg.addEventListener('pointermove', this.boundPointerMove);
    this.svg.addEventListener('pointerup', this.boundPointerUp);
    this.svg.addEventListener('pointercancel', this.boundPointerUp);

    if (this.options.enableKeyboardUndo) {
      document.addEventListener('keydown', this.boundKeyDown);
    }
  }

  /** Disable node dragging. */
  disable(): void {
    if (!this.enabled || this.destroyed) {
      return;
    }
    this.enabled = false;

    const nodes = this.svg.querySelectorAll<SVGGElement>('g.node');
    for (const g of nodes) {
      g.style.cursor = '';
      g.removeEventListener('pointerdown', this.boundPointerDown);
    }

    this.svg.removeEventListener('pointermove', this.boundPointerMove);
    this.svg.removeEventListener('pointerup', this.boundPointerUp);
    this.svg.removeEventListener('pointercancel', this.boundPointerUp);

    if (this.options.enableKeyboardUndo) {
      document.removeEventListener('keydown', this.boundKeyDown);
    }

    this.dragState = null;
    this.dragActive = false;
  }

  /** Undo the last node move. */
  undo(): boolean {
    if (this.undoStack.length === 0) {
      return false;
    }
    const snap = this.undoStack.pop()!;
    this.redoStack.push(this.captureState());
    this.applySnapshot(snap);
    return true;
  }

  /** Redo the last undone move. */
  redo(): boolean {
    if (this.redoStack.length === 0) {
      return false;
    }
    const snap = this.redoStack.pop()!;
    this.undoStack.push(this.captureState());
    this.applySnapshot(snap);
    return true;
  }

  /** Get current position of every tracked node. */
  getNodePositions(): Record<string, NodePosition> {
    const result: Record<string, NodePosition> = {};
    for (const [id, node] of this.nodeMap) {
      result[id] = { x: node.x, y: node.y };
    }
    return result;
  }

  /**
   * Re-parse the SVG DOM to pick up newly rendered nodes / edges.
   * Call this after `mermaid.render()` replaces the SVG content.
   */
  refresh(): void {
    this.buildMaps();
    if (this.options.expandViewBox) {
      this.expandViewBox();
    }
    // Re-attach listeners if currently enabled
    if (this.enabled) {
      this.disable();
      this.enable();
    }
  }

  /** Fully destroy the plugin — remove all listeners and clear state. */
  destroy(): void {
    this.disable();
    this.nodeMap.clear();
    this.edgeMap.clear();
    this.undoStack = [];
    this.redoStack = [];
    this.dragState = null;
    this.destroyed = true;
  }

  /* ------------------------------------------------------------------ */
  /*  SVG map building                                                   */
  /* ------------------------------------------------------------------ */

  private buildMaps(): void {
    this.nodeMap.clear();
    this.edgeMap.clear();
    const diagramId = this.svg.id;

    // ── Nodes ──
    const containers = this.svg.querySelectorAll('.nodes');
    for (const c of containers) {
      const nodeEls = c.querySelectorAll<SVGGElement>('g.node');
      for (const g of nodeEls) {
        const domId = g.getAttribute('id');
        if (!domId) {
          continue;
        }
        const uid = this.extractNodeId(domId, diagramId);
        if (!uid || this.nodeMap.has(uid)) {
          continue;
        }
        const pos = this.parseTransform(g);
        if (!pos) {
          continue;
        }
        const bbox = g.getBBox();
        this.nodeMap.set(uid, { element: g, x: pos.x, y: pos.y, bbox });
      }
    }

    // ── Edges ──
    const edgePathEls = this.svg.querySelectorAll<SVGPathElement>('path[data-source]');
    for (const p of edgePathEls) {
      const src = p.getAttribute('data-source');
      const tgt = p.getAttribute('data-target');
      const eid = p.getAttribute('data-id') ?? p.getAttribute('id') ?? '';
      if (src && tgt) {
        this.edgeMap.set(eid, { element: p, source: src, target: tgt, labelEl: null });
      }
    }

    // ── Associate edge labels with paths by DOM position ──
    const labelEls = this.svg.querySelectorAll<SVGGElement>('g.edgeLabels > g.edgeLabel');
    if (labelEls.length > 0) {
      const edgeEntries = [...this.edgeMap.values()];
      for (let i = 0; i < edgeEntries.length && i < labelEls.length; i++) {
        edgeEntries[i].labelEl = labelEls[i];
      }
    }
  }

  /** Extract user-facing node id from mermaid's SVG id attribute. */
  private extractNodeId(domId: string, diagramId: string): string | null {
    const prefix = `${diagramId}-flowchart-`;
    if (domId.startsWith(prefix)) {
      const rest = domId.slice(prefix.length);
      const lastDash = rest.lastIndexOf('-');
      return lastDash === -1 ? rest : rest.slice(0, lastDash);
    }
    const fallback = /(?:^|-)flowchart-(.+)$/.exec(domId);
    if (fallback) {
      const rest = fallback[1];
      const lastDash = rest.lastIndexOf('-');
      return lastDash === -1 ? rest : rest.slice(0, lastDash);
    }
    return null;
  }

  /** Parse a `translate(x, y)` transform value. */
  private parseTransform(el: SVGGElement): { x: number; y: number } | null {
    const t = el.getAttribute('transform');
    if (!t) {
      return null;
    }
    const m = /translate\(\s*([\d.-]+)\s*[ ,]\s*([\d.-]+)\s*\)/.exec(t);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
  }

  private setTransform(el: SVGGElement, x: number, y: number): void {
    el.setAttribute('transform', `translate(${x.toFixed(1)}, ${y.toFixed(1)})`);
  }

  /* ------------------------------------------------------------------ */
  /*  ViewBox                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Expand the SVG viewBox so that nodes can be dragged outside the
   * original layout area without being clipped.
   */
  expandViewBox(padding?: number): void {
    const vb = this.svg.getAttribute('viewBox');
    if (!vb) {
      return;
    }
    const p = padding ?? this.options.viewBoxPadding;
    const [x, y, w, h] = vb.split(/[ ,]+/).map(Number);
    this.svg.setAttribute('viewBox', `${x - p} ${y - p} ${w + p * 2} ${h + p * 2}`);
  }

  /* ------------------------------------------------------------------ */
  /*  Node rect helper                                                   */
  /* ------------------------------------------------------------------ */

  /** Get the current axis-aligned bounding rect of a node in viewBox coords. */
  private getNodeRect(nodeData: NodeData): Rect | null {
    const pos = this.parseTransform(nodeData.element);
    if (!pos || !nodeData.bbox) {
      return null;
    }
    return {
      x: pos.x + nodeData.bbox.x,
      y: pos.y + nodeData.bbox.y,
      width: nodeData.bbox.width,
      height: nodeData.bbox.height,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Pointer event handlers                                             */
  /* ------------------------------------------------------------------ */

  private getViewBoxPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.svg.getBoundingClientRect();
    const vb = this.svg.getAttribute('viewBox');
    if (!vb) {
      return { x: clientX - rect.left, y: clientY - rect.top };
    }
    const [vbx, vby, vbw, vbh] = vb.split(/[ ,]+/).map(Number);
    const sx = vbw / rect.width;
    const sy = vbh / rect.height;
    return {
      x: (clientX - rect.left) * sx + vbx,
      y: (clientY - rect.top) * sy + vby,
    };
  }

  private captureState(): DragSnapshot {
    const snap: DragSnapshot = { nodes: {}, edges: {} };
    for (const [id, node] of this.nodeMap) {
      snap.nodes[id] = { x: node.x, y: node.y };
    }
    for (const [id, edge] of this.edgeMap) {
      snap.edges[id] = edge.element.getAttribute('d') ?? '';
    }
    return snap;
  }

  private applySnapshot(snap: DragSnapshot): void {
    for (const [id, pos] of Object.entries(snap.nodes)) {
      const node = this.nodeMap.get(id);
      if (node) {
        this.setTransform(node.element, pos.x, pos.y);
        node.x = pos.x;
        node.y = pos.y;
      }
    }
    for (const [id, d] of Object.entries(snap.edges)) {
      const edge = this.edgeMap.get(id);
      if (edge) {
        edge.element.setAttribute('d', d);
        positionEdgeLabel(edge.element, edge.labelEl);
      }
    }
  }

  /* ---- Pointer event callbacks (arrow-bound to instance) ---- */

  private onPointerDown(e: PointerEvent): void {
    const g = e.currentTarget as SVGGElement;
    if (e.button !== 0) {
      return;
    }
    g.setPointerCapture(e.pointerId);

    const id = g.getAttribute('id');
    if (!id) {
      return;
    }
    const userNodeId = this.extractNodeId(id, this.svg.id);
    if (!userNodeId || !this.nodeMap.has(userNodeId)) {
      return;
    }

    const pos = this.parseTransform(g);
    if (!pos) {
      return;
    }

    const vb = this.getViewBoxPoint(e.clientX, e.clientY);

    // Pre-drag snapshot
    const snap = this.captureState();

    // Connected edges
    const connected: EdgeData[] = [];
    for (const edge of this.edgeMap.values()) {
      if (edge.source === userNodeId || edge.target === userNodeId) {
        connected.push(edge);
      }
    }

    this.dragState = {
      nodeId: userNodeId,
      startPointerX: vb.x,
      startPointerY: vb.y,
      startNodeX: pos.x,
      startNodeY: pos.y,
      connectedEdges: connected,
      undoSnapshot: snap,
    };

    g.classList.add('dragging');
    g.style.cursor = 'grabbing';
    this.dragActive = false;

    this.callbacks.onDragStart?.(userNodeId, { x: pos.x, y: pos.y });
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragState) {
      return;
    }
    const g = this.nodeMap.get(this.dragState.nodeId)?.element;
    if (!g) {
      return;
    }

    const vb = this.getViewBoxPoint(e.clientX, e.clientY);
    const dx = vb.x - this.dragState.startPointerX;
    const dy = vb.y - this.dragState.startPointerY;

    if (!this.dragActive && Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      return;
    }
    this.dragActive = true;

    const newX = this.dragState.startNodeX + dx;
    const newY = this.dragState.startNodeY + dy;
    this.setTransform(g, newX, newY);

    // Rebuild connected edges
    for (const edge of this.dragState.connectedEdges) {
      const srcNode = this.nodeMap.get(edge.source);
      const tgtNode = this.nodeMap.get(edge.target);
      if (!srcNode || !tgtNode) {
        continue;
      }
      const srcRect = this.getNodeRect(srcNode);
      const tgtRect = this.getNodeRect(tgtNode);
      if (srcRect && tgtRect) {
        updateEdgePath(srcRect, tgtRect, edge.element, edge.labelEl);
      }
    }

    this.callbacks.onDrag?.(this.dragState.nodeId, { x: newX, y: newY });
  }

  private onPointerUp(_e: PointerEvent): void {
    if (!this.dragState) {
      return;
    }

    const g = this.nodeMap.get(this.dragState.nodeId)?.element;
    if (g) {
      g.classList.remove('dragging');
      g.style.cursor = 'grab';
    }

    if (this.dragActive) {
      const pos = this.parseTransform(g!);
      if (pos) {
        this.undoStack.push(this.dragState.undoSnapshot);
        // Cap undo stack
        while (this.undoStack.length > this.options.maxUndoStack) {
          this.undoStack.shift();
        }
        this.redoStack = [];

        const nodeData = this.nodeMap.get(this.dragState.nodeId);
        if (nodeData) {
          nodeData.x = pos.x;
          nodeData.y = pos.y;
        }

        this.callbacks.onDragEnd?.(this.dragState.nodeId, { x: pos.x, y: pos.y });
      }
    }

    this.dragState = null;
    this.dragActive = false;
  }

  /* ------------------------------------------------------------------ */
  /*  Keyboard undo / redo                                               */
  /* ------------------------------------------------------------------ */

  private onKeyDown(e: KeyboardEvent): void {
    if (!(e.ctrlKey || e.metaKey)) {
      return;
    }

    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
    } else if ((e.key === 'z' && e.shiftKey) || e.key === 'Z') {
      e.preventDefault();
      this.redo();
    }
  }
}
