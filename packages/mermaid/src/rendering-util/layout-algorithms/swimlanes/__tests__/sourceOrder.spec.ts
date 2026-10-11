import { beforeAll, describe, it, expect } from 'vitest';
import { Diagram } from '../../../../Diagram.js';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../../types.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

// Parse real swimlane source and run the layout core with fixed node sizes,
// the same hand-off `ddlt/backends.ts` uses (minus captured DOM sizes).
async function layoutFromSource(source: string): Promise<LayoutData> {
  const diagram = await Diagram.fromText(source);
  const layout = (diagram.db as { getData: () => LayoutData }).getData();
  (layout as LayoutData & { direction?: string }).direction = (
    diagram.db as { getDirection?: () => string }
  ).getDirection?.();
  layout.config = { flowchart: { nodeSpacing: 40, rankSpacing: 100 } } as LayoutData['config'];
  for (const node of layout.nodes) {
    if (!node.isGroup) {
      node.width = 80;
      node.height = 40;
    }
  }
  prepareLayoutForSwimlanes(layout);
  runSwimlaneLayoutCore(layout);
  return layout;
}

function contentOrder(layout: LayoutData, axis: 'x' | 'y'): string[] {
  return layout.nodes
    .filter((node) => !node.isGroup)
    .sort((a, b) => (a[axis] ?? 0) - (b[axis] ?? 0))
    .map((node) => node.id);
}

describe('Swimlanes — unconnected nodes keep source order (#8355)', () => {
  beforeAll(() => {
    addDiagrams();
  });

  it('two nodes in one lane (TB)', async () => {
    const layout = await layoutFromSource(`swimlane-beta
  subgraph s1
    Sunday
    Monday
  end`);
    expect(contentOrder(layout, 'y')).toEqual(['Sunday', 'Monday']);
  });

  it('five nodes in one lane (TB)', async () => {
    const layout = await layoutFromSource(`swimlane-beta
  subgraph s1
    Wednesday
    Tuesday
    Friday
    Monday
    Thursday
  end`);
    expect(contentOrder(layout, 'y')).toEqual([
      'Wednesday',
      'Tuesday',
      'Friday',
      'Monday',
      'Thursday',
    ]);
  });

  it('unconnected nodes in two lanes', async () => {
    const layout = await layoutFromSource(`swimlane-beta
  subgraph s1
    Sunday
    Monday
  end
  subgraph s2
    Zeta
    Alpha
  end`);
    const order = contentOrder(layout, 'y');
    expect(order.indexOf('Sunday')).toBeLessThan(order.indexOf('Monday'));
    expect(order.indexOf('Zeta')).toBeLessThan(order.indexOf('Alpha'));
  });

  it('five nodes in one lane (LR)', async () => {
    const layout = await layoutFromSource(`swimlane-beta LR
  subgraph s1
    Wednesday
    Tuesday
    Friday
    Monday
    Thursday
  end`);
    expect(contentOrder(layout, 'x')).toEqual([
      'Wednesday',
      'Tuesday',
      'Friday',
      'Monday',
      'Thursday',
    ]);
  });
});
