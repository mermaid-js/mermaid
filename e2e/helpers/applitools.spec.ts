import { describe, expect, it } from 'vitest';
import { applitoolsBatch, applitoolsTestName } from './applitools.ts';

describe('applitoolsBatch', () => {
  it('groups mmd fixtures by their diagram folder, not the runner spec', () => {
    expect(
      applitoolsBatch('run1', 'rendering/mmd-snapshots.spec.ts', 'diagrams/flowchart/foo')
    ).toEqual({ id: 'mermaid-batch-run1-diagrams/flowchart', name: 'diagrams/flowchart' });
  });

  it('keeps nested fixture folders as their own batch', () => {
    expect(
      applitoolsBatch(
        'run1',
        'rendering/mmd-snapshots.spec.ts',
        'diagrams/c4/characterization/boundaries/x'
      ).name
    ).toBe('diagrams/c4/characterization/boundaries');
  });

  it('puts every fixture in a folder into the same batch', () => {
    const a = applitoolsBatch('run1', 'rendering/mmd-snapshots.spec.ts', 'diagrams/packet/a');
    const b = applitoolsBatch('run1', 'rendering/mmd-snapshots.spec.ts', 'diagrams/packet/b');
    expect(a).toEqual(b);
  });

  it('groups spec-based tests by the spec path', () => {
    expect(applitoolsBatch('run1', 'rendering/flowchart/flowchart.spec.js')).toEqual({
      id: 'mermaid-batch-run1-rendering/flowchart/flowchart.spec.js',
      name: 'rendering/flowchart/flowchart.spec.js',
    });
  });

  it('falls back to the spec when the screenshot path has no folder', () => {
    expect(applitoolsBatch('run1', 'other/xss.spec.js', 'flat').name).toBe('other/xss.spec.js');
  });

  it('separates runs by run id', () => {
    const a = applitoolsBatch('run1', 'rendering/theme.spec.js');
    const b = applitoolsBatch('run2', 'rendering/theme.spec.js');
    expect(a.name).toBe(b.name);
    expect(a.id).not.toBe(b.id);
  });
});

describe('applitoolsTestName', () => {
  it('names mmd fixtures by their base name (the batch already names the folder)', () => {
    expect(
      applitoolsTestName(
        'rendering/mmd-snapshots.spec.ts-mmd-snapshots-flowchart-foo',
        'rendering/mmd-snapshots.spec.ts',
        'diagrams/flowchart/foo'
      )
    ).toBe('foo');
  });

  it('drops the spec-file prefix Playwright prepends to the title path', () => {
    expect(
      applitoolsTestName(
        'rendering/flowchart/flowchart.spec.js-Flowchart-1:-should-render',
        'rendering/flowchart/flowchart.spec.js'
      )
    ).toBe('Flowchart-1:-should-render');
  });

  it('keeps explicit names untouched', () => {
    expect(applitoolsTestName('Basic-States', 'rendering/state/stateDiagram-neo.spec.js')).toBe(
      'Basic-States'
    );
  });

  it('falls back to the spec rule when the screenshot path has no folder', () => {
    expect(applitoolsTestName('other/xss.spec.js-XSS-1', 'other/xss.spec.js', 'flat')).toBe(
      'XSS-1'
    );
  });
});
