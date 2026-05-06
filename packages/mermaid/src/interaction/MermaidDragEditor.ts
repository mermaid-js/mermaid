import type { DragEditorOptions, NodePosition, OverrideData, ScannedNode } from './types.js';
import { CoordinateConverter } from './CoordinateConverter.js';
import { NodeScanner, getParentAccumulatedOffset } from './NodeScanner.js';
import { DragHandler } from './DragHandler.js';
import { OverrideStore } from './OverrideStore.js';
import { UndoManager } from './UndoManager.js';
import { EdgeUpdater } from './EdgeUpdater.js';

/** 交互样式，注入到 SVG 的 <style> 中 */
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
 * Mermaid 图表可视化微调主控制器。
 *
 * 在不修改 Mermaid 核心源码的前提下，通过对 Mermaid 渲染后的 SVG DOM
 * 做二次增强，实现节点拖拽、位置持久化、撤销/重做等功能。
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

  /** 节点映射（nodeId → 扫描结果） */
  private nodeMap = new Map<string, ScannedNode>();
  /** 自动布局下的基线位置（未应用任何覆盖） */
  private basePositions = new Map<string, NodePosition>();

  constructor(options: DragEditorOptions) {
    this.svgElement = options.svgElement;
    this.options = options;

    const storageKey = options.storageKey ?? this.svgElement.id ?? 'default';
    const layout = 'dagre'; // 默认布局，后续可从 SVG 检测

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
   * 启用拖拽交互。
   * 会自动注入样式、加载保存的覆盖数据，并绑定事件。
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
   * 禁用拖拽交互。
   * 解绑事件但保留样式和覆盖数据。
   */
  disable(): void {
    if (!this.enabled) {
      return;
    }
    this.dragHandler.unbind();
    this.enabled = false;
  }

  /**
   * 撤销上一步拖拽操作
   */
  undo(): void {
    this.undoManager.undo();
    void this.saveCurrentState();
  }

  /**
   * 重做被撤销的拖拽操作
   */
  redo(): void {
    this.undoManager.redo();
    void this.saveCurrentState();
  }

  /**
   * 恢复自动布局（清除所有覆盖，触发重新渲染）
   */
  async resetLayout(): Promise<void> {
    this.store.clear();
    this.undoManager.clear();
    this.dragHandler.clearSelection();

    if (this.options.mermaidCode && this.options.renderFn) {
      this.disable();
      const newSvg = await this.options.renderFn(this.options.mermaidCode);

      // 替换旧 SVG
      if (this.svgElement.parentNode) {
        this.svgElement.parentNode.replaceChild(newSvg, this.svgElement);
      }

      this.svgElement = newSvg;
      // 重新初始化所有依赖 SVG 的模块
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

  /**
   * 选中指定节点
   */
  selectNode(nodeId: string): void {
    this.dragHandler.selectNode(nodeId);
  }

  /**
   * 多选节点
   */
  selectNodes(nodeIds: string[]): void {
    this.dragHandler.replaceSelection(nodeIds);
  }

  /**
   * 清除所有选中
   */
  clearSelection(): void {
    this.dragHandler.clearSelection();
  }

  /**
   * 获取当前所有覆盖数据
   */
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

  /**
   * 导入覆盖数据并立即应用到当前 SVG
   */
  async importOverrides(data: OverrideData): Promise<void> {
    this.store.replace(data);
    this.undoManager.clear();
    this.restoreBaseLayout(false);
    this.store.applyTo(this.nodeMap, this.svgElement);
    this.edgeUpdater.updateAllEdges();
    await this.saveCurrentState();
  }

  /**
   * 手动设置节点位置并持久化。
   *
   * @param nodeId - 节点 ID
   * @param x - 绝对 viewBox X 坐标
   * @param y - 绝对 viewBox Y 坐标
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
   * 锁定/解锁节点
   *
   * @param nodeId - 节点 ID
   * @param locked - 是否锁定
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

  /**
   * 销毁编辑器，解绑所有事件，清理资源
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.dragHandler.unbind();
    this.removeDraggableClass();
    this.enabled = false;
    this.destroyed = true;
  }

  // ==================== 内部方法 ====================

  /**
   * 拖拽完成后的处理：保存覆盖数据并推入历史
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

  /**
   * 获取节点的自动布局位置（从当前 SVG 中读取，优先读覆盖前的位置）
   */
  private getAutoLayoutPosition(nodeId: string): NodePosition {
    return this.basePositions.get(nodeId) ?? { x: 0, y: 0 };
  }

  /**
   * 将给定绝对位置应用到节点 DOM。
   * undo/redo 和外部 restore 均通过此方法恢复节点位置。
   *
   * @param positions - nodeId 到 (x, y) 的绝对 viewBox 坐标映射
   * @param nodeMap - 当前节点映射
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

  /**
   * 刷新节点映射（重新扫描 SVG）
   */
  private refreshNodeMap(): void {
    this.nodeMap = this.scanner.scan();
    this.dragHandler?.updateNodeMap(this.nodeMap);
    this.undoManager?.updateNodeMap(this.nodeMap);
  }

  /**
   * 保存当前覆盖状态
   */
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

  /**
   * 注入交互 CSS 样式到 SVG
   */
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

  /**
   * 给所有节点添加 draggable class
   */
  private addDraggableClass(): void {
    for (const [, scanned] of [...this.nodeMap]) {
      scanned.element.classList.add('draggable');
    }
  }

  /**
   * 移除所有节点的 draggable class
   */
  private removeDraggableClass(): void {
    for (const [, scanned] of [...this.nodeMap]) {
      scanned.element.classList.remove('draggable', 'selected', 'dragging', 'locked');
    }
  }
}
