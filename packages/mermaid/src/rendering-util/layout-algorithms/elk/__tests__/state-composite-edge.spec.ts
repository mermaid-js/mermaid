// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { runElkLayoutCore } from '../render.js';
import type { LayoutData } from '../../../types.js';
import { StateDB } from '../../../../diagrams/state/stateDb.js';
// @ts-expect-error No types available for JISON
import stateDiagram from '../../../../diagrams/state/parser/stateDiagram.jison';
import { setConfig } from '../../../../config.js';

setConfig({ securityLevel: 'strict', state: {}, flowchart: {} });

const log = {
  debug: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};
const ctx = {
  helpers: {
    common: { lineBreakRegex: /<br\s*\/?>/gi },
    getConfig: () => ({ flowchart: { wrappingWidth: 200 }, curve: undefined, elk: {} }),
    interpolateToCurve: (curve: unknown) => curve,
    log,
  },
  options: { algorithm: 'elk.layered' },
} as any;

const parseState = (text: string) => {
  const db = new StateDB(2);
  stateDiagram.parser.yy = db;
  stateDiagram.parser.yy.clear();
  stateDiagram.parser.parse(text);
  return db.getData();
};

describe('state composite edges (#8719)', () => {
  it('Boot --> Running (composite to its own child)', async () => {
    const data = parseState(`stateDiagram-v2
      state Boot {
        Running
        Boot --> Running
      }`);
    data.config = { ...(data.config ?? {}), elk: {} };
    expect(data.nodes.find((n) => n.id === 'Boot')?.parentId).toBeUndefined();
    expect(data.nodes.find((n) => n.id === 'Running')?.parentId).toBe('Boot');
    await runElkLayoutCore(data as unknown as LayoutData, ctx);
  }, 20000);

  it('Running --> Boot (child to its own parent)', async () => {
    const data = parseState(`stateDiagram-v2
      state Boot {
        Running
        Running --> Boot
      }`);
    data.config = { ...(data.config ?? {}), elk: {} };
    expect(data.nodes.find((n) => n.id === 'Boot')?.parentId).toBeUndefined();
    expect(data.nodes.find((n) => n.id === 'Running')?.parentId).toBe('Boot');
    await runElkLayoutCore(data as unknown as LayoutData, ctx);
  }, 20000);

  it('Outer --> Inner declared inside Inner (ancestor to descendant)', async () => {
    const data = parseState(`stateDiagram-v2
      state Outer {
        state Inner {
          deep
          Outer --> Inner
        }
      }`);
    data.config = { ...(data.config ?? {}), elk: {} };
    expect(data.nodes.find((n) => n.id === 'Outer')?.parentId).toBeUndefined();
    expect(data.nodes.find((n) => n.id === 'Inner')?.parentId).toBe('Outer');
    expect(data.nodes.find((n) => n.id === 'deep')?.parentId).toBe('Inner');
    await runElkLayoutCore(data as unknown as LayoutData, ctx);
  }, 20000);

  it('keeps existing placement behavior for references across unrelated composites', () => {
    const data = parseState(`stateDiagram-v2
      state A {
        one --> shared
      }
      state B {
        shared --> two
      }`);
    expect(data.nodes.find((node) => node.id === 'shared')?.parentId).toBe('B');
  });

  it('preserves a nested composite parent when referenced from its child', () => {
    const data = parseState(`stateDiagram-v2
      state Outer {
        state Middle {
          state Inner {
            deep
            Inner --> Middle
          }
        }
      }`);
    expect(data.nodes.find((node) => node.id === 'Middle')?.parentId).toBe('Outer');
    expect(data.nodes.find((node) => node.id === 'Inner')?.parentId).toBe('Middle');
  });
  it('allows an explicit nested declaration after an earlier relation reference', () => {
    const data = parseState(`stateDiagram-v2
      A --> B
      state G {
        A
      }`);
    expect(data.nodes.find((node) => node.id === 'A')?.parentId).toBe('G');
  });
});
