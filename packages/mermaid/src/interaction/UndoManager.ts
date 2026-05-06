import type { HistoryEntry, NodePosition, ScannedNode } from './types.js';

/**
 * 撤销/重做管理器。
 *
 * 固定深度历史：当历史条目超过 maxDepth 时，从头部移除最旧条目。
 */
export class UndoManager {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;
  private maxDepth: number;
  private applyFn: (
    positions: Record<string, NodePosition>,
    nodeMap: Map<string, ScannedNode>
  ) => void;
  private nodeMap: Map<string, ScannedNode>;

  constructor(
    maxDepth: number,
    nodeMap: Map<string, ScannedNode>,
    applyFn: (positions: Record<string, NodePosition>, nodeMap: Map<string, ScannedNode>) => void
  ) {
    this.maxDepth = maxDepth;
    this.nodeMap = nodeMap;
    this.applyFn = applyFn;
  }

  /**
   * 是否有可撤销的操作
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * 是否有可重做的操作
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 更新节点映射（rescan 后调用）
   */
  updateNodeMap(nodeMap: Map<string, ScannedNode>): void {
    this.nodeMap = nodeMap;
  }

  /**
   * 清空撤销/重做历史
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * 推入新的拖拽操作到历史记录。
   * 如果 currentIndex 不在末尾，丢弃后续历史（标准重做行为）。
   */
  push(entry: HistoryEntry): void {
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(entry);

    if (this.history.length > this.maxDepth) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * 撤销上一步操作
   */
  undo(): void {
    if (!this.canUndo()) {
      return;
    }

    const entry = this.history[this.currentIndex];
    this.applyFn(entry.before, this.nodeMap);
    this.currentIndex--;
  }

  /**
   * 重做被撤销的操作
   */
  redo(): void {
    if (!this.canRedo()) {
      return;
    }

    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    this.applyFn(entry.after, this.nodeMap);
  }
}
