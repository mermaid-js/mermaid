import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Diagram } from '../../../../Diagram.js';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../../types.js';
import { compareStrings } from '../compare.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

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

const originalLocaleCompare = Object.getOwnPropertyDescriptor(String.prototype, 'localeCompare')!;

function defaultLocaleCompareTo(locale: string) {
  Object.defineProperty(String.prototype, 'localeCompare', {
    configurable: true,
    writable: true,
    value: function (
      this: string,
      that: string,
      locales?: string | string[],
      options?: Intl.CollatorOptions
    ) {
      return (originalLocaleCompare.value as typeof String.prototype.localeCompare).call(
        this,
        that,
        locales ?? locale,
        options
      );
    },
  });
}

describe('Swimlanes — layout is stable across locales (#8759)', () => {
  beforeAll(() => {
    addDiagrams();
  });

  afterEach(() => {
    Object.defineProperty(String.prototype, 'localeCompare', originalLocaleCompare);
  });

  it('compareStrings uses English order when Estonian would swap z and t', () => {
    expect('z'.localeCompare('t', 'et-EE')).toBeLessThan(0);
    expect('z'.localeCompare('t', 'en')).toBeGreaterThan(0);
    expect(compareStrings('z', 't')).toBeGreaterThan(0);
    expect(compareStrings('t', 'z')).toBeLessThan(0);
  });

  it('keeps English rank order when the default locale is Estonian', async () => {
    defaultLocaleCompareTo('et-EE');
    const layout = await layoutFromSource(`swimlane-beta TB
  subgraph L1[Lane]
    t[Tea] --> t2[Tea 2]
    z[Zinc] --> z2[Zinc 2]
  end`);
    expect(contentOrder(layout, 'y')).toEqual(['t', 't2', 'z', 'z2']);
  });
});
