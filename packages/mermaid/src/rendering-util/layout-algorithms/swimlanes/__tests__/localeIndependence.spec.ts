import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Diagram } from '../../../../Diagram.js';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../../types.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

// The ids in SOURCES sort differently in these locales than in English: Estonian puts z
// before t, Czech puts ch after h, Danish puts b after B, Swedish puts a-umlaut after z.
const REFERENCE_LOCALE = 'en-US';
const OTHER_LOCALES = ['et-EE', 'cs-CZ', 'da-DK', 'sv-SE'];

const SOURCES: Record<string, string> = {
  'sources t and z': `swimlane-beta TB
  subgraph L1[Lane]
    t[Tea] --> t2[Tea 2]
    z[Zinc] --> z2[Zinc 2]
  end`,
  'ids a-umlaut and z': `swimlane-beta TB
  subgraph L1[Lane]
    ä[Apfel] --> ä2[Apfel 2]
    z[Zebra] --> z2[Zebra 2]
  end`,
  'a cycle between t and z': `swimlane-beta TB
  subgraph L1[Lane]
    s[Start] --> t[Tea]
    s --> z[Zinc]
    t --> z
    z --> t
  end`,
  'ids b and B': `swimlane-beta TB
  subgraph L1[Lane]
    b[small b] --> b2[small b 2]
    B[big B] --> B2[big B 2]
  end`,
  'ids ch and h': `swimlane-beta TB
  subgraph L1[Lane]
    ch[Check] --> ch2[Check 2]
    h[Hold] --> h2[Hold 2]
  end`,
  'two lanes, LR': `swimlane-beta LR
  subgraph S[Sales]
    s[Start] --> t[Tea]
    s --> z[Zinc]
  end
  subgraph W[Warehouse]
    t --> y[Yard]
    z --> y
  end`,
};

/** Makes a `localeCompare` call without a locale argument sort as it does for a reader of `locale`. */
function readAs(locale: string): void {
  vi.spyOn(String.prototype, 'localeCompare').mockImplementation(function (
    this: string,
    that: string,
    locales?: Intl.LocalesArgument,
    options?: Intl.CollatorOptions
  ) {
    return new Intl.Collator(locales ?? locale, options).compare(this, that);
  });
}

async function layOut(source: string): Promise<LayoutData> {
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

/** Every position and edge route the layout produced, in a stable order. */
function geometry(layout: LayoutData): unknown {
  return {
    nodes: layout.nodes
      .map(({ id, x, y, width, height }) => ({ id, x, y, width, height }))
      .sort((a, b) => (a.id < b.id ? -1 : 1)),
    edges: layout.edges
      .map(({ id, points }) => ({ id, points }))
      .sort((a, b) => (a.id < b.id ? -1 : 1)),
  };
}

async function layOutAs(locale: string, source: string): Promise<unknown> {
  readAs(locale);
  try {
    return geometry(await layOut(source));
  } finally {
    vi.restoreAllMocks();
  }
}

describe('swimlane layout does not depend on the reader locale (#8759)', () => {
  beforeAll(() => {
    addDiagrams();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('the stand-in really sorts like an Estonian reader', () => {
    readAs('et-EE');
    expect('z'.localeCompare('t')).toBe(-1);
    expect('z'.localeCompare('t', 'en')).toBe(1);
  });

  it('puts t before z by code unit, as an English reader sees it', async () => {
    const layout = await layOut(SOURCES['sources t and z']);
    const byY = layout.nodes
      .filter((node) => !node.isGroup)
      .sort((a, b) => (a.y ?? 0) - (b.y ?? 0))
      .map((node) => node.id);
    expect(byY).toEqual(['t', 't2', 'z', 'z2']);
  });

  describe.each(Object.entries(SOURCES))('%s', (_name, source) => {
    it.each(OTHER_LOCALES)('lays out the same for a reader in %s as in en-US', async (locale) => {
      expect(await layOutAs(locale, source)).toEqual(await layOutAs(REFERENCE_LOCALE, source));
    });
  });
});
