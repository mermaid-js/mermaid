import type { DragSnapshot, ScannedNode } from './types.js';
import type { CoordinateConverter } from './CoordinateConverter.js';
import type { NodeScanner } from './NodeScanner.js';
import { getParentAccumulatedOffset } from './NodeScanner.js';
import type { EdgeUpdater } from './EdgeUpdater.js';

/** Pixel threshold to distinguish a click from a drag. */
const DRAG_THRESHOLD = 3;

/**
 * Drag handler - manages pointer event binding and drag state.
 *
 * Event flow:
 *   pointerdown → record start, mark dragging, setPointerCapture
 *   pointermove → calc delta, update node transforms and connected edges
 *   pointerup   → record end, clean up drag state
 */
export class DragHandler {
  private svgElement: SVGElement;
  private converter: CoordinateConverter;
  private scanner: NodeScanner;
  private edgeUpdater: EdgeUpdater;

  /** Node map (nodeId → scan result). */
  private nodeMap: Map<string, ScannedNode>;
  /** Snapshot of drag state at start. */
  private dragSnapshot: DragSnapshot | null = null;
  /** Currently selected node IDs. */
  private selectedNodes = new Set<string>();
  /** Pointer ID from the pointerdown event. */
  private activePointerId: number | null = null;
  /** Whether the drag threshold has been exceeded. */
  private hasMoved = false;
  /** requestAnimationFrame handle for throttling. */
  private rafId: number | null = null;

  /** Callback invoked on drag end with moved nodes and their new positions. */
  private onDragEnd?: (updatedNodes: { nodeId: string; x: number; y: number }[]) => void;

  constructor(
    svgElement: SVGElement,
    nodeMap: Map<string, ScannedNode>,
    converter: CoordinateConverter,
    scanner: NodeScanner,
    edgeUpdater: EdgeUpdater
  ) {
    this.svgElement = svgElement;
    this.nodeMap = nodeMap;
    this.converter = converter;
    this.scanner = scanner;
    this.edgeUpdater = edgeUpdater;
  }

  /** Sets the drag-end callback. */
  setOnDragEnd(cb: (updatedNodes: { nodeId: string; x: number; y: number }[]) => void): void {
    this.onDragEnd = cb;
  }

  /** Updates the node map reference (e.g. after resetLayout). */
  updateNodeMap(nodeMap: Map<string, ScannedNode>): void {
    this.nodeMap = nodeMap;
    this.selectedNodes = new Set([...this.selectedNodes].filter((nodeId) => nodeMap.has(nodeId)));
    this.applySelectionStyles();
  }

  // ==================== Selection management ====================

  /** Selects a single node, clearing any previous selection. */
  selectNode(nodeId: string): void {
    this.clearSelection();
    this.selectedNodes.add(nodeId);
    this.applySelectionStyles();
  }

  /** Replaces the current selection with a set of node IDs. */
  replaceSelection(nodeIds: Iterable<string>): void {
    this.selectedNodes.clear();
    for (const nodeId of nodeIds) {
      if (this.nodeMap.has(nodeId)) {
        this.selectedNodes.add(nodeId);
      }
    }
    this.applySelectionStyles();
  }

  /** Clears the current selection. */
  clearSelection(): void {
    this.selectedNodes.clear();
    this.applySelectionStyles();
  }

  /** Returns the currently selected node IDs. */
  getSelectedNodes(): Set<string> {
    return this.selectedNodes;
  }

  /** Applies CSS classes for selected nodes. */
  private applySelectionStyles(): void {
    for (const [nodeId, scanned] of [...this.nodeMap]) {
      if (this.selectedNodes.has(nodeId)) {
        scanned.element.classList.add('selected');
      } else {
        scanned.element.classList.remove('selected');
      }
    }
  }

  // ==================== Event binding ====================

  /** Binds all pointer events to the SVG element. */
  bind(): void {
    this.svgElement.addEventListener('pointerdown', this.handlePointerDown);
    this.svgElement.addEventListener('pointermove', this.handlePointerMove);
    this.svgElement.addEventListener('pointerup', this.handlePointerUp);
    this.svgElement.addEventListener('pointercancel', this.handlePointerUp);
    // Prevent default touch scrolling
    this.svgElement.style.touchAction = 'none';
  }

  /** Unbinds all pointer events. */
  unbind(): void {
    this.svgElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.svgElement.removeEventListener('pointermove', this.handlePointerMove);
    this.svgElement.removeEventListener('pointerup', this.handlePointerUp);
    this.svgElement.removeEventListener('pointercancel', this.handlePointerUp);
    this.svgElement.style.touchAction = '';
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // ==================== Event handlers ====================

  private handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    const nodeId = this.scanner.findNodeIdFromTarget(event.target, this.nodeMap);
    if (!nodeId) {
      if (!event.shiftKey) {
        this.clearSelection();
      }
      return;
    }

    const scanned = this.nodeMap.get(nodeId);
    if (!scanned) {
      return;
    }

    // Shift+click toggles multi-select
    if (event.shiftKey) {
      if (this.selectedNodes.has(nodeId)) {
        this.selectedNodes.delete(nodeId);
      } else {
        this.selectedNodes.add(nodeId);
      }
      this.applySelectionStyles();

      if (this.selectedNodes.size === 0) {
        this.dragSnapshot = null;
        return;
      }
    } else {
      // Regular click
      if (!this.selectedNodes.has(nodeId)) {
        this.selectedNodes.clear();
        this.selectedNodes.add(nodeId);
        this.applySelectionStyles();
      }
    }

    if (scanned.locked) {
      return;
    }

    const viewBoxPoint = this.converter.clientToViewBox(event.clientX, event.clientY);

    // Record original positions of all selected nodes
    const originalPositions = new Map<string, { x: number; y: number }>();
    for (const selId of [...this.selectedNodes]) {
      const selNode = this.nodeMap.get(selId);
      if (selNode) {
        originalPositions.set(selId, {
          x: selNode.currentX,
          y: selNode.currentY,
        });
      }
    }

    this.dragSnapshot = {
      originalPositions,
      startPoint: viewBoxPoint,
      lastAppliedDelta: { x: 0, y: 0 },
    };
    this.activePointerId = event.pointerId;
    this.hasMoved = false;
    event.preventDefault();

    try {
      this.svgElement.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers may not support setPointerCapture on SVG
    }

    // Add dragging style
    for (const selId of [...this.selectedNodes]) {
      const selNode = this.nodeMap.get(selId);
      if (selNode) {
        selNode.element.classList.add('dragging');
      }
    }
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragSnapshot || this.activePointerId !== event.pointerId) {
      return;
    }

    const viewBoxPoint = this.converter.clientToViewBox(event.clientX, event.clientY);

    const deltaX = viewBoxPoint.x - this.dragSnapshot.startPoint.x;
    const deltaY = viewBoxPoint.y - this.dragSnapshot.startPoint.y;

    // Check if we've exceeded the drag threshold
    if (!this.hasMoved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
      return;
    }
    this.hasMoved = true;

    // Throttle with requestAnimationFrame
    if (this.rafId !== null) {
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.applyDragTransform(deltaX, deltaY);
    });
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    if (this.dragSnapshot) {
      const viewBoxPoint = this.converter.clientToViewBox(event.clientX, event.clientY);
      const deltaX = viewBoxPoint.x - this.dragSnapshot.startPoint.x;
      const deltaY = viewBoxPoint.y - this.dragSnapshot.startPoint.y;

      if (this.hasMoved || Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
        this.hasMoved = true;
        this.applyDragTransform(deltaX, deltaY);
      }
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    try {
      this.svgElement.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }

    // Remove dragging style
    for (const selId of [...this.selectedNodes]) {
      const selNode = this.nodeMap.get(selId);
      if (selNode) {
        selNode.element.classList.remove('dragging');
      }
    }

    if (this.hasMoved && this.dragSnapshot) {
      const updatedNodes: { nodeId: string; x: number; y: number }[] = [];
      for (const [nodeId, scanned] of [...this.nodeMap]) {
        if (this.selectedNodes.has(nodeId)) {
          updatedNodes.push({
            nodeId,
            x: scanned.currentX,
            y: scanned.currentY,
          });
        }
      }
      if (this.onDragEnd) {
        this.onDragEnd(updatedNodes);
      }
    }

    this.dragSnapshot = null;
    this.activePointerId = null;
    this.hasMoved = false;
  };

  /**
   * Applies the delta translation to all selected nodes and their
   * connected edges.
   *
   * Coordinate conversion note:
   *   - original.x/y (from dragSnapshot) are viewBox absolute coordinates
   *   - Node DOM transforms are local coordinates relative to the parent <g>
   *   - Therefore we subtract ancestor accumulated offsets before writing
   *     to the DOM
   */
  private applyDragTransform(deltaX: number, deltaY: number): void {
    if (!this.dragSnapshot) {
      return;
    }

    const movedNodeIds = new Set<string>();

    for (const nodeId of [...this.selectedNodes]) {
      const original = this.dragSnapshot.originalPositions.get(nodeId);
      const scanned = this.nodeMap.get(nodeId);
      if (!original || !scanned || scanned.locked) {
        continue;
      }

      const newX = original.x + deltaX;
      const newY = original.y + deltaY;

      const parentOffset = getParentAccumulatedOffset(scanned.element, this.svgElement);
      const localX = newX - parentOffset.x;
      const localY = newY - parentOffset.y;

      scanned.element.setAttribute('transform', `translate(${localX}, ${localY})`);
      scanned.currentX = newX;
      scanned.currentY = newY;

      movedNodeIds.add(nodeId);
    }

    // Node positions have been committed this frame; recompute edges directly
    this.edgeUpdater.updateEdgesForNodes(movedNodeIds);

    this.dragSnapshot.lastAppliedDelta = { x: deltaX, y: deltaY };
  }
}
