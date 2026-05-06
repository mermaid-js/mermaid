import type { DragEditorOptions, NodePosition, OverrideData, ScannedNode } from './types.js';
import { CoordinateConverter } from './CoordinateConverter.js';
import { NodeScanner, getParentAccumulatedOffset } from './NodeScanner.js';
import { DragHandler } from './DragHandler.js';
import { OverrideStore } from './OverrideStore.js';
import { UndoManager } from './UndoManager.js';
import { EdgeUpdater } from './EdgeUpdater.js';

/** Interaction styles injected into a <style> element inside the SVG. */
const INTERACTION_STYLES = `
.node.draggable {
  cursor: grab;
}
.node.draggable:hover {
  filter: brightness(0.95);
}
.node.selected {
  outline: 2px solid #1a73e8;
  outline-offset: 2px;
}
.node.dragging {
  cursor: grabbing;
  opacity: 0.9;
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
}
.node.locked {
  cursor: not-allowed;
  opacity: 0.7;
}
`;

/**
 * Mermaid diagram drag editor — the main orchestrator for interactive
 * node repositioning.
 *
 * Enhances a rendered Mermaid SVG DOM (without modifying Mermaid's core)
 * to support node dragging, position persistence, undo/redo, and more.
 *
 * @example
 * ```typescript
 * const editor = new MermaidDragEditor({
 *   svgElement: document.querySelector('#mermaid-0'),
 *   storageKey: 'my-diagram',
 * });
 * await editor.enable();
 * ```
 */
export class MermaidDragEditor {
  private svgElement: SVGElement;
  private options: DragEditorOptions;
  private enabled = false;
  private destroyed = false;

  private converter: CoordinateConverter;
  private scanner: NodeScanner;
  private store: OverrideStore;
  private edgeUpdater: EdgeUpdater;
  private dragHandler: DragHandler;
  private undoManager: UndoManager;

  /** Node map (nodeId → scan result). */
  private nodeMap = new Map<string, ScannedNode>();
  /** Base positions under auto-layout (before applying any overrides). */
  private basePositions = new Map<string, NodePosition>();

  constructor(options: DragEditorOptions) {
    this.svgElement = options.svgElement;
    this.options = options;

    const storageKey = options.storageKey ?? this.svgElement.id ?? 'default';
    const layout = 'dagre'; // Default layout; could be detected from SVG later

    this.converter = new CoordinateConverter(this.svgElement);
    this.scanner = new NodeScanner(this.svgElement);
    this.edgeUpdater = new EdgeUpdater(this.svgElement);
    this.store = new OverrideStore(storageKey, layout, options.onSave, options.onLoad);

    this.nodeMap = this.scanner.scan();
    this.captureBasePositions();
    this.edgeUpdater.buildEdgeMap(this.nodeMap);
    this.dragHandler = this.createDragHandler();

    this.undoManager = new UndoManager(
      options.maxUndoDepth ?? 50,
      this.nodeMap,
      (positions, nodeMap) => {
        this.applyPositions(positions, nodeMap);
      }
    );
  }

  /**
   * Enables drag interaction.
   * Injects styles, loads saved overrides, and binds events.
   */
  async enable(): Promise<void> {
    if (this.enabled || this.destroyed) {
      return;
    }

    this.injectStyles();
    this.refreshNodeMap();
    this.captureBasePositions();
    this.edgeUpdater.buildEdgeMap(this.nodeMap);
    this.addDraggableClass();

    await this.store.load();
    this.store.applyTo(this.nodeMap, this.svgElement);
    this.edgeUpdater.updateAllEdges();

    this.dragHandler.bind();
    this.enabled = true;
  }

  /**
   * Disables drag interaction.
   * Unbinds events but retains styles and override data.
   */
  disable(): void {
    if (!this.enabled) {
      return;
    }
    this.dragHandler.unbind();
    this.enabled = false;
  }

  /** Undoes the last drag operation. */
  undo(): void {
    this.undoManager.undo();
    void this.saveCurrentState();
  }

  /** Redoes the previously undone drag operation. */
  redo(): void {
    this.undoManager.redo();
    void this.saveCurrentState();
  }

  /**
   * Resets to auto-layout (clears all overrides and triggers re-render if
   * a renderFn was provided).
   */
  async resetLayout(): Promise<void> {
    this.store.clear();
    this.undoManager.clear();
    this.dragHandler.clearSelection();

    if (this.options.mermaidCode && this.options.renderFn) {
      this.disable();
      const newSvg = await this.options.renderFn(this.options.mermaidCode);

      // Replace the old SVG
      if (this.svgElement.parentNode) {
        this.svgElement.parentNode.replaceChild(newSvg, this.svgElement);
      }

      this.svgElement = newSvg;
      // Re-initialize all SVG-dependent modules
      this.converter = new CoordinateConverter(this.svgElement);
      this.scanner = new NodeScanner(this.svgElement);
      this.edgeUpdater = new EdgeUpdater(this.svgElement);

      this.refreshNodeMap();
      this.captureBasePositions();
      this.edgeUpdater.buildEdgeMap(this.nodeMap);
      this.undoManager.updateNodeMap(this.nodeMap);
      this.dragHandler = this.createDragHandler();

      this.addDraggableClass();
      this.injectStyles();
      this.dragHandler.bind();
      this.enabled = true;
      await this.store.save();
    } else {
      this.restoreBaseLayout();
      await this.store.save();
    }
  }

  /** Selects a single node, clearing any previous selection. */
  selectNode(nodeId: string): void {
    this.dragHandler.selectNode(nodeId);
  }

  /** Selects multiple nodes. */
  selectNodes(nodeIds: string[]): void {
    this.dragHandler.replaceSelection(nodeIds);
  }

  /** Clears the current selection. */
  clearSelection(): void {
    this.dragHandler.clearSelection();
  }

  /** Returns all current override data. */
  getOverrides(): OverrideData {
    return {
      version: 1,
      layout: 'dagre',
      overrides: {
        nodes: this.store.getAll(),
        edges: {},
      },
    };
  }

  /** Imports override data and applies it to the current SVG immediately. */
  async importOverrides(data: OverrideData): Promise<void> {
    this.store.replace(data);
    this.undoManager.clear();
    this.restoreBaseLayout(false);
    this.store.applyTo(this.nodeMap, this.svgElement);
    this.edgeUpdater.updateAllEdges();
    await this.saveCurrentState();
  }

  /**
   * Manually sets a node's position and persists it.
   *
   * @param nodeId - Node ID
   * @param x - Absolute viewBox X coordinate
   * @param y - Absolute viewBox Y coordinate
   */
  setNodePosition(nodeId: string, x: number, y: number): void {
    const scanned = this.nodeMap.get(nodeId);
    if (!scanned) {
      return;
    }

    const parentOffset = getParentAccumulatedOffset(scanned.element, this.svgElement);
    const localX = x - parentOffset.x;
    const localY = y - parentOffset.y;

    scanned.element.setAttribute('transform', `translate(${localX}, ${localY})`);
    scanned.currentX = x;
    scanned.currentY = y;
    this.syncNodeOverride(nodeId, { x, y }, scanned.locked);
    this.edgeUpdater.updateEdgesForNodes([nodeId]);
    void this.store.save();
  }

  /**
   * Locks or unlocks a node.
   *
   * @param nodeId - Node ID
   * @param locked - Whether to lock the node
   */
  setNodeLocked(nodeId: string, locked: boolean): void {
    const scanned = this.nodeMap.get(nodeId);
    if (!scanned) {
      return;
    }

    scanned.locked = locked;
    if (locked) {
      scanned.element.classList.add('locked');
    } else {
      scanned.element.classList.remove('locked');
    }
    this.syncNodeOverride(nodeId, { x: scanned.currentX, y: scanned.currentY }, locked);
    void this.store.save();
  }

  /** Destroys the editor: unbinds events and cleans up resources. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.dragHandler.unbind();
    this.removeDraggableClass();
    this.enabled = false;
    this.destroyed = true;
  }

  // ==================== Internal methods ====================

  /**
   * Handler called after a drag completes: saves overrides and pushes to
   * undo history.
   */
  private onDragFinished(updatedNodes: { nodeId: string; x: number; y: number }[]): void {
    if (updatedNodes.length === 0) {
      return;
    }

    const before: Record<string, NodePosition> = {};
    const after: Record<string, NodePosition> = {};

    for (const { nodeId, x, y } of updatedNodes) {
      const oldOverride = this.store.get(nodeId);
      before[nodeId] = oldOverride
        ? { x: oldOverride.x, y: oldOverride.y }
        : this.getAutoLayoutPosition(nodeId);

      this.syncNodeOverride(nodeId, { x, y });
      after[nodeId] = { x, y };
    }

    this.undoManager.push({
      nodeIds: updatedNodes.map((n) => n.nodeId),
      before,
      after,
    });

    void this.saveCurrentState();
  }

  /** Gets a node's auto-layout position from the baseline snapshot. */
  private getAutoLayoutPosition(nodeId: string): NodePosition {
    return this.basePositions.get(nodeId) ?? { x: 0, y: 0 };
  }

  /**
   * Applies absolute positions to node DOM elements.
   * Used by undo, redo, and external restore operations.
   *
   * @param positions - nodeId to (x, y) absolute viewBox coordinate mapping
   * @param nodeMap - Current node map
   */
  private applyPositions(
    positions: Record<string, NodePosition>,
    nodeMap: Map<string, ScannedNode>
  ): void {
    const updatedNodeIds = new Set<string>();

    for (const [nodeId, pos] of Object.entries(positions)) {
      const scanned = nodeMap.get(nodeId);
      if (!scanned) {
        continue;
      }

      const parentOffset = getParentAccumulatedOffset(scanned.element, this.svgElement);
      const localX = pos.x - parentOffset.x;
      const localY = pos.y - parentOffset.y;

      scanned.element.setAttribute('transform', `translate(${localX}, ${localY})`);
      scanned.currentX = pos.x;
      scanned.currentY = pos.y;
      this.syncNodeOverride(nodeId, pos, scanned.locked);
      updatedNodeIds.add(nodeId);
    }

    this.edgeUpdater.updateEdgesForNodes(updatedNodeIds);
  }

  /** Refreshes the node map by re-scanning the SVG. */
  private refreshNodeMap(): void {
    this.nodeMap = this.scanner.scan();
    this.dragHandler?.updateNodeMap(this.nodeMap);
    this.undoManager?.updateNodeMap(this.nodeMap);
  }

  /** Saves the current override state. */
  private async saveCurrentState(): Promise<void> {
    await this.store.save();
  }

  private createDragHandler(): DragHandler {
    const dragHandler = new DragHandler(
      this.svgElement,
      this.nodeMap,
      this.converter,
      this.scanner,
      this.edgeUpdater
    );

    dragHandler.setOnDragEnd((updatedNodes) => {
      this.onDragFinished(updatedNodes);
    });

    return dragHandler;
  }

  private captureBasePositions(): void {
    this.basePositions = new Map(
      [...this.nodeMap.entries()].map(([nodeId, scanned]) => [
        nodeId,
        { x: scanned.currentX, y: scanned.currentY },
      ])
    );
  }

  private restoreBaseLayout(clearOverrides = true): void {
    if (clearOverrides) {
      this.store.clear();
    }

    for (const [nodeId, pos] of [...this.basePositions.entries()]) {
      const scanned = this.nodeMap.get(nodeId);
      if (!scanned) {
        continue;
      }

      const parentOffset = getParentAccumulatedOffset(scanned.element, this.svgElement);
      const localX = pos.x - parentOffset.x;
      const localY = pos.y - parentOffset.y;

      scanned.element.setAttribute('transform', `translate(${localX}, ${localY})`);
      scanned.currentX = pos.x;
      scanned.currentY = pos.y;
      scanned.locked = false;
      scanned.element.classList.remove('locked');
    }

    this.edgeUpdater.updateAllEdges();
  }

  private syncNodeOverride(nodeId: string, position: NodePosition, locked = false): void {
    const base = this.basePositions.get(nodeId);
    if (base && base.x === position.x && base.y === position.y && !locked) {
      this.store.delete(nodeId);
      return;
    }

    this.store.set(nodeId, position.x, position.y, locked);
  }

  /** Injects interaction CSS styles into the SVG. */
  private injectStyles(): void {
    const existing = this.svgElement.querySelector('style#mermaid-drag-styles');
    if (existing) {
      return;
    }

    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.setAttribute('id', 'mermaid-drag-styles');
    styleEl.textContent = INTERACTION_STYLES;

    const firstChild = this.svgElement.firstChild;
    if (firstChild) {
      this.svgElement.insertBefore(styleEl, firstChild);
    } else {
      this.svgElement.appendChild(styleEl);
    }
  }

  /** Adds the 'draggable' CSS class to all nodes. */
  private addDraggableClass(): void {
    for (const [, scanned] of [...this.nodeMap]) {
      scanned.element.classList.add('draggable');
    }
  }

  /** Removes interaction CSS classes from all nodes. */
  private removeDraggableClass(): void {
    for (const [, scanned] of [...this.nodeMap]) {
      scanned.element.classList.remove('draggable', 'selected', 'dragging', 'locked');
    }
  }
}
