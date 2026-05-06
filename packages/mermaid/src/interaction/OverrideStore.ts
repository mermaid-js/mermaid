import type { NodeOverride, OverrideData, ScannedNode } from './types.js';
import { getParentAccumulatedOffset } from './NodeScanner.js';
import { log } from '../logger.js';

const CURRENT_VERSION = 1;
const LOCAL_STORAGE_PREFIX = 'mermaid-override-';

/**
 * 覆盖数据存储管理器。
 *
 * 存储策略（两级回退）：
 *   1. 如果设置了 onSave / onLoad 回调，优先使用
 *   2. 否则使用 localStorage，key 为 "mermaid-override-storageKey"
 */
export class OverrideStore {
  private storageKey: string;
  private layout: string;
  private overrides: Record<string, NodeOverride> = {};
  private onSave?: (data: OverrideData) => Promise<void>;
  private onLoad?: () => Promise<OverrideData | null>;

  constructor(
    storageKey: string,
    layout: string,
    onSave?: (data: OverrideData) => Promise<void>,
    onLoad?: () => Promise<OverrideData | null>
  ) {
    this.storageKey = storageKey;
    this.layout = layout;
    this.onSave = onSave;
    this.onLoad = onLoad;
  }

  /**
   * 记录单个节点的覆盖坐标
   */
  set(nodeId: string, x: number, y: number, locked?: boolean): void {
    this.overrides[nodeId] = { x, y, locked };
  }

  /**
   * 获取单个节点的覆盖坐标
   */
  get(nodeId: string): NodeOverride | null {
    return this.overrides[nodeId] ?? null;
  }

  /**
   * 获取所有覆盖数据
   */
  getAll(): Record<string, NodeOverride> {
    return { ...this.overrides };
  }

  /**
   * 删除单个节点的覆盖数据
   */
  delete(nodeId: string): void {
    delete this.overrides[nodeId];
  }

  /**
   * 清除所有覆盖数据
   */
  clear(): void {
    this.overrides = {};
  }

  /**
   * 直接用外部数据替换当前覆盖数据
   */
  replace(data: OverrideData | null): void {
    if (data?.overrides?.nodes) {
      this.overrides = { ...data.overrides.nodes };
      this.layout = data.layout ?? this.layout;
      return;
    }

    this.clear();
  }

  /**
   * 构建完整 OverrideData 对象
   */
  private buildOverrideData(): OverrideData {
    return {
      version: CURRENT_VERSION,
      layout: this.layout,
      overrides: {
        nodes: { ...this.overrides },
        edges: {},
      },
    };
  }

  /**
   * 持久化覆盖数据到存储
   */
  async save(): Promise<void> {
    const data = this.buildOverrideData();

    if (this.onSave) {
      await this.onSave(data);
      return;
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + this.storageKey, JSON.stringify(data));
    } catch (e) {
      log.warn('[MermaidDragEditor] Failed to save to localStorage:', e);
    }
  }

  /**
   * 从存储加载覆盖数据
   */
  async load(): Promise<OverrideData | null> {
    let data: OverrideData | null = null;

    if (this.onLoad) {
      data = await this.onLoad();
    } else {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + this.storageKey);
        if (raw) {
          data = JSON.parse(raw) as OverrideData;
        }
      } catch (e) {
        log.warn('[MermaidDragEditor] Failed to load from localStorage:', e);
      }
    }

    this.replace(data);

    return data;
  }

  /**
   * 将已保存的覆盖数据应用到当前 SVG。
   *
   * 恢复逻辑：
   *   1. 覆盖数据存储的是绝对 viewBox 坐标
   *   2. 应用到 DOM 前需转换为节点自身的本地坐标（减去祖先偏移）
   *   3. 如果源码中已删除该节点，忽略对应覆盖
   *   4. 新增的节点（无覆盖数据）保留自动布局位置
   *
   * @param nodeMap - 当前节点映射
   * @param svgElement - SVG 根元素（用于计算祖先偏移）
   */
  applyTo(nodeMap: Map<string, ScannedNode>, svgElement: SVGElement): void {
    for (const [, scanned] of [...nodeMap]) {
      scanned.locked = false;
      scanned.element.classList.remove('locked');
    }

    for (const [nodeId, override] of Object.entries(this.overrides)) {
      const scanned = nodeMap.get(nodeId);
      if (!scanned) {
        continue;
      }

      const { element } = scanned;
      const parentOffset = getParentAccumulatedOffset(element, svgElement);
      const localX = override.x - parentOffset.x;
      const localY = override.y - parentOffset.y;

      element.setAttribute('transform', `translate(${localX}, ${localY})`);
      scanned.currentX = override.x;
      scanned.currentY = override.y;
      scanned.locked = Boolean(override.locked);
      element.classList.toggle('locked', scanned.locked);
    }
  }
}
