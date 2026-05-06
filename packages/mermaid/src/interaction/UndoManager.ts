import type { HistoryEntry, NodePosition, ScannedNode } from './types.js';

/**
 * Undo/redo manager.
 *
 * Fixed-depth history: when entries exceed maxDepth, the oldest entry is
 * shifted from the front.
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

  /** Whether there are any undoable operations. */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /** Whether there are any operations to redo. */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /** Updates the node map reference (called after rescan). */
  updateNodeMap(nodeMap: Map<string, ScannedNode>): void {
    this.nodeMap = nodeMap;
  }

  /** Clears all undo/redo history. */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Pushes a new drag operation onto the history stack.
   * If currentIndex is not at the end, subsequent history entries are
   * discarded (standard redo-branching behavior).
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

  /** Undoes the last operation. */
  undo(): void {
    if (!this.canUndo()) {
      return;
    }

    const entry = this.history[this.currentIndex];
    this.applyFn(entry.before, this.nodeMap);
    this.currentIndex--;
  }

  /** Redoes the previously undone operation. */
  redo(): void {
    if (!this.canRedo()) {
      return;
    }

    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    this.applyFn(entry.after, this.nodeMap);
  }
}
