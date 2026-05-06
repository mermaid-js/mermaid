import type { DragSnapshot, ScannedNode } from './types.js';
import type { CoordinateConverter } from './CoordinateConverter.js';
import type { NodeScanner } from './NodeScanner.js';
import { getParentAccumulatedOffset } from './NodeScanner.js';
import type { EdgeUpdater } from './EdgeUpdater.js';

/** 判断鼠标是否发生了有效移动的阈值（像素） */
const DRAG_THRESHOLD = 3;

/**
 * 拖拽处理器 —— 管理 pointer 事件的绑定与拖拽状态。
 *
 * 事件流：
 *   pointerdown → 记录起点，标记拖拽中，setPointerCapture
 *   pointermove → 计算偏移量，更新节点 transform 和关联边
 *   pointerup   → 记录终点，清理拖拽状态
 */
export class DragHandler {
  private svgElement: SVGElement;
  private converter: CoordinateConverter;
  private scanner: NodeScanner;
  private edgeUpdater: EdgeUpdater;

  /** 节点映射（nodeId → 扫描结果） */
  private nodeMap: Map<string, ScannedNode>;
  /** 拖拽开始时的状态快照 */
  private dragSnapshot: DragSnapshot | null = null;
  /** 当前选中的节点 ID 集合 */
  private selectedNodes = new Set<string>();
  /** pointerdown 时的 pointerId */
  private activePointerId: number | null = null;
  /** 是否已经超过拖拽阈值 */
  private hasMoved = false;
  /** requestAnimationFrame 的节流标志 */
  private rafId: number | null = null;

  /** 拖拽结束回调，返回移动的节点及其新位置 */
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

  /**
   * 设置拖拽结束回调
   */
  setOnDragEnd(cb: (updatedNodes: { nodeId: string; x: number; y: number }[]) => void): void {
    this.onDragEnd = cb;
  }

  /**
   * 更新节点映射（如 resetLayout 后）
   */
  updateNodeMap(nodeMap: Map<string, ScannedNode>): void {
    this.nodeMap = nodeMap;
    this.selectedNodes = new Set([...this.selectedNodes].filter((nodeId) => nodeMap.has(nodeId)));
    this.applySelectionStyles();
  }

  // ==================== 选中管理 ====================

  /**
   * 选中指定节点
   */
  selectNode(nodeId: string): void {
    this.clearSelection();
    this.selectedNodes.add(nodeId);
    this.applySelectionStyles();
  }

  /**
   * 用一组节点替换当前选中集
   */
  replaceSelection(nodeIds: Iterable<string>): void {
    this.selectedNodes.clear();
    for (const nodeId of nodeIds) {
      if (this.nodeMap.has(nodeId)) {
        this.selectedNodes.add(nodeId);
      }
    }
    this.applySelectionStyles();
  }

  /**
   * 清除所有选中
   */
  clearSelection(): void {
    this.selectedNodes.clear();
    this.applySelectionStyles();
  }

  /**
   * 获取当前选中的节点集合
   */
  getSelectedNodes(): Set<string> {
    return this.selectedNodes;
  }

  /** 应用选中样式 */
  private applySelectionStyles(): void {
    for (const [nodeId, scanned] of [...this.nodeMap]) {
      if (this.selectedNodes.has(nodeId)) {
        scanned.element.classList.add('selected');
      } else {
        scanned.element.classList.remove('selected');
      }
    }
  }

  // ==================== 事件绑定 ====================

  /**
   * 绑定所有指针事件到 SVG 元素
   */
  bind(): void {
    this.svgElement.addEventListener('pointerdown', this.handlePointerDown);
    this.svgElement.addEventListener('pointermove', this.handlePointerMove);
    this.svgElement.addEventListener('pointerup', this.handlePointerUp);
    this.svgElement.addEventListener('pointercancel', this.handlePointerUp);
    // 阻止浏览器默认的触摸滚动
    this.svgElement.style.touchAction = 'none';
  }

  /**
   * 解绑所有指针事件
   */
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

  // ==================== 事件处理 ====================

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

    // Shift+点击 = 切换多选
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
      // 普通点击
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

    // 记录所有选中节点的原始位置
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
      // 部分浏览器可能不支持 setPointerCapture on SVG
    }

    // 添加拖拽样式
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

    // 判断是否超过拖拽阈值
    if (!this.hasMoved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
      return;
    }
    this.hasMoved = true;

    // 使用 requestAnimationFrame 节流
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

    // 移除拖拽样式
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
   * 将位移应用到所有选中节点及其关联边。
   *
   * 坐标转换说明：
   *   - original.x/y（dragSnapshot 中）是 viewBox 绝对坐标
   *   - 但节点 DOM 的 transform 是相对于其父级 <g> 的本地坐标
   *   - 因此写入 DOM 前需要减去祖先累积偏移量
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

    // 节点位置已经在当前帧内落地，边直接按当前 nodeMap 重算即可。
    this.edgeUpdater.updateEdgesForNodes(movedNodeIds);

    this.dragSnapshot.lastAppliedDelta = { x: deltaX, y: deltaY };
  }
}
