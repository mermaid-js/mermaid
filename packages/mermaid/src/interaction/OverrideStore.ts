import type { NodeOverride, OverrideData, ScannedNode } from './types.js';
import { getParentAccumulatedOffset } from './NodeScanner.js';
import { log } from '../logger.js';

const CURRENT_VERSION = 1;
const LOCAL_STORAGE_PREFIX = 'mermaid-override-';

/**
 * Override data storage manager.
 *
 * Storage strategy (two-level fallback):
 *   1. If onSave / onLoad callbacks are provided, use them first.
 *   2. Otherwise fall back to localStorage with key "mermaid-override-<storageKey>".
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

  /** Records the override coordinates for a single node. */
  set(nodeId: string, x: number, y: number, locked?: boolean): void {
    this.overrides[nodeId] = { x, y, locked };
  }

  /** Gets the override coordinates for a single node. */
  get(nodeId: string): NodeOverride | null {
    return this.overrides[nodeId] ?? null;
  }

  /** Returns a copy of all override data. */
  getAll(): Record<string, NodeOverride> {
    return { ...this.overrides };
  }

  /** Deletes the override data for a single node. */
  delete(nodeId: string): void {
    delete this.overrides[nodeId];
  }

  /** Clears all override data. */
  clear(): void {
    this.overrides = {};
  }

  /** Replaces current overrides with external data. */
  replace(data: OverrideData | null): void {
    if (data?.overrides?.nodes) {
      this.overrides = { ...data.overrides.nodes };
      this.layout = data.layout ?? this.layout;
      return;
    }

    this.clear();
  }

  /** Builds a complete OverrideData object from the current state. */
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

  /** Persists override data to storage. */
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

  /** Loads override data from storage. */
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
   * Applies saved overrides to the current SVG.
   *
   * Recovery logic:
   *   1. Overrides store absolute viewBox coordinates
   *   2. Convert to node-local coordinates (subtract ancestor offsets) before
   *      applying to the DOM
   *   3. Skip overrides for nodes that no longer exist in the source
   *   4. New nodes (no override) retain their auto-layout position
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
