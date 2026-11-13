// Ported from mermaid-v13 `packages/core/src/layout/layered/layered.spec.ts`.
import { describe, expect, it } from 'vitest';
import type { LayoutModel } from './types.js';
import { countCrossings, validateLayout } from './validate.test-support.js';
import { layered } from './index.js';
import { handBuiltFixtures, type LayoutFixture } from './layered.fixtures.js';

// Hook for parser-produced fixtures: once the v13 flowchart parser and table measurer exist,
// graphs built from the e2e `.mmd` corpus join this list (from a spec in a package that may
// import the parser), and the same checks run over them.
const FIXTURES: LayoutFixture[] = handBuiltFixtures();

function plain(model: LayoutModel): unknown {
  return {
    ...model,
    nodes: [...model.nodes],
    edges: [...model.edges],
    groups: [...model.groups],
  };
}

describe('layered: DDLT checks on fixtures', () => {
  it.each(FIXTURES.map((f) => [f.name, f] as const))('%s is a valid layout', (_, fixture) => {
    expect(validateLayout(fixture.graph, layered(fixture.graph))).toEqual([]);
  });

  it.each(FIXTURES.map((f) => [f.name, f] as const))('%s lays out the same twice', (_, fixture) => {
    const copy = JSON.parse(JSON.stringify(fixture.graph)) as typeof fixture.graph;
    expect(plain(layered(fixture.graph))).toEqual(plain(layered(copy)));
  });

  it('records crossing counts', () => {
    const counts = Object.fromEntries(
      FIXTURES.map((f) => [f.name, countCrossings(layered(f.graph))])
    );
    expect(counts).toMatchSnapshot();
  });
});
