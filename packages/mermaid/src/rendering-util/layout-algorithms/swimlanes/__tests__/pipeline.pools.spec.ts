import { describe, it, expect } from 'vitest';
import type { LayoutData, Node } from '../../../types.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const lane = (id: string, parentId?: string): Node =>
  ({ id, isGroup: true, padding: 20, ...(parentId ? { parentId } : {}) }) as Node;

const pool = (id: string): Node =>
  ({ id, isGroup: true, padding: 20, metadata: { laneRole: 'pool' } }) as unknown as Node;

const box = (id: string, parentId: string): Node =>
  ({ id, isGroup: false, width: 100, height: 50, parentId }) as Node;

/** One pool holding two lanes, with a flow crossing from the first to the second. */
function pooledLayout(direction: string): LayoutData {
  return {
    nodes: [
      pool('shop'),
      lane('sales', 'shop'),
      lane('warehouse', 'shop'),
      box('a', 'sales'),
      box('b', 'warehouse'),
    ],
    edges: [{ id: 'eAB', start: 'a', end: 'b', type: 'normal' }],
    config: { flowchart: { nodeSpacing: 40, rankSpacing: 80 } },
    direction,
  } as unknown as LayoutData;
}

const find = (layout: LayoutData, id: string): Node => layout.nodes.find((n) => n.id === id)!;

describe('a pool in the swimlane pipeline', () => {
  it.each(['TB', 'LR'])('lays out without hanging (%s)', (direction) => {
    const layout = pooledLayout(direction);
    runSwimlaneLayoutCore(layout);

    expect(find(layout, 'a').x).toBeDefined();
    expect(find(layout, 'b').x).toBeDefined();
  });

  it('frames the pool around both of its lanes in LR', () => {
    const layout = pooledLayout('LR');
    runSwimlaneLayoutCore(layout);

    const shop = find(layout, 'shop');
    const sales = find(layout, 'sales');
    const warehouse = find(layout, 'warehouse');

    const degenerate = [shop, sales, warehouse]
      .map((band) => ({ id: band.id, width: band.width, height: band.height }))
      .filter((band) => !(band.width! > 0) || !(band.height! > 0));
    expect(degenerate).toEqual([]);

    // The pool has to reach past both lanes on the cross axis, and start to their left
    // so its own name band has somewhere to sit.
    const laneTop = Math.min(sales.y! - sales.height! / 2, warehouse.y! - warehouse.height! / 2);
    const laneBottom = Math.max(sales.y! + sales.height! / 2, warehouse.y! + warehouse.height! / 2);
    expect(shop.y! - shop.height! / 2).toBeLessThanOrEqual(laneTop + 0.5);
    expect(shop.y! + shop.height! / 2).toBeGreaterThanOrEqual(laneBottom - 0.5);
    expect(shop.x! - shop.width! / 2).toBeLessThan(sales.x! - sales.width! / 2);
  });
});
