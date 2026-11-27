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

/**
 * Applitools finds a check's baseline by app name, test name and environment within the
 * branch. The batch only groups results for display, so the test name alone has to tell
 * two checks apart.
 */
describe('applitoolsTestName', () => {
  const MMD_SPEC = 'rendering/mmd-snapshots.spec.ts';
  const fixtureName = (path: string) =>
    applitoolsTestName(`${MMD_SPEC}-mmd-snapshots-${path.replace(/\//g, '-')}`, MMD_SPEC, path);

  it('names an mmd fixture by its path inside diagrams/', () => {
    expect(fixtureName('diagrams/flowchart/visual-check/foo')).toBe('flowchart/visual-check/foo');
  });

  it('tells a fixture apart from a copy of it in a subfolder', () => {
    expect(fixtureName('diagrams/flowchart/visual-check/layered/foo')).not.toBe(
      fixtureName('diagrams/flowchart/visual-check/foo')
    );
  });

  it('tells fixtures with the same file name in different diagram types apart', () => {
    expect(fixtureName('diagrams/journey/pr-check/dark-theme')).not.toBe(
      fixtureName('diagrams/state-diagram-v2/nightly-check/dark-theme')
    );
  });

  it('keeps the spec path Playwright puts at the start of the title path', () => {
    expect(
      applitoolsTestName(
        'rendering/flowchart/flowchart.spec.js-Flowchart-1:-should-render',
        'rendering/flowchart/flowchart.spec.js'
      )
    ).toBe('rendering/flowchart/flowchart.spec.js-Flowchart-1:-should-render');
  });

  it('puts the spec path in front of an explicit name', () => {
    expect(applitoolsTestName('Basic-States', 'rendering/state/stateDiagram-neo.spec.js')).toBe(
      'rendering/state/stateDiagram-neo.spec.js-Basic-States'
    );
  });

  it('tells the same explicit name in two specs apart', () => {
    expect(applitoolsTestName('class', 'rendering/grid/pr-check/grid-layout.spec.ts')).not.toBe(
      applitoolsTestName('class', 'rendering/class/pr-check/class.spec.ts')
    );
  });

  it('falls back to the spec rule when the screenshot path has no folder', () => {
    expect(applitoolsTestName('other/xss.spec.js-XSS-1', 'other/xss.spec.js', 'flat')).toBe(
      'other/xss.spec.js-XSS-1'
    );
  });
});
