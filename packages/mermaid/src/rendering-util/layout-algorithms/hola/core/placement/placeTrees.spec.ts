/**
 * Face expansion (guide §17.4): what the constraint generator does and does not
 * ask for. Over-asking here is what drives a tree far outside the core.
 */

import { describe, expect, it } from 'vitest';
import { createGraph } from '../model.js';
import type { HolaNode } from '../model.js';
import { ConstraintSystem } from '../constraints/solver.js';
import { DiagnosticCollector } from '../diagnostics.js';
import { resolveOptions } from '../options.js';
import type { Face } from '../planarization/dcel.js';
import type { PlanarisedCore } from '../planarization/planarise.js';
import type { CoreLayoutState } from '../state.js';
import { makeEntity } from '../state.js';
import { clearanceShift, expansionConstraintsFor } from './placeTrees.js';
import type { PlaceableTree } from './placeTrees.js';

function makeState(entities: HolaNode[]): CoreLayoutState {
  const state: CoreLayoutState = {
    componentId: 'c0',
    core: createGraph(),
    entities: new Map(entities.map((entity) => [entity.id, entity])),
    bends: new Map(),
    system: new ConstraintSystem(),
    options: resolveOptions(),
    diagnostics: new DiagnosticCollector(),
    fixedDirections: new Map(),
    placeholders: new Set(),
  };
  return state;
}

/** A face whose boundary is exactly the given vertices, drawn as an inner face. */
function makeFace(boundary: string[]): Face {
  return {
    index: 1,
    halfEdges: [],
    boundary,
    signedArea: 1,
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    isExternal: false,
  };
}

function makePlanar(ids: string[]): PlanarisedCore {
  return {
    nodes: new Map(ids.map((id) => [id, { id, x: 0, y: 0, kind: 'core' as const }])),
    segments: [],
    dcel: { vertices: new Map(), halfEdges: new Map(), faces: [] },
  } as unknown as PlanarisedCore;
}

const TREE: PlaceableTree = {
  id: 'tree:0:root',
  coreNodeId: 'root',
  rootCopyId: '~rootcopy/tree:0:root',
  layout: { nodes: new Map(), edges: [], bounds: undefined, rootPosition: { x: 0, y: 0 } } as never,
  layoutForHorizontalGrowth: {
    nodes: new Map(),
    edges: [],
    bounds: undefined,
    rootPosition: { x: 0, y: 0 },
  } as never,
};

describe('face expansion constraint generation (guide §17.4)', () => {
  /**
   * `sameBand` shares the placeholder's y range, so only an x separation can
   * part them. `aboveBand` is far above: it is already clear on y, and asking
   * for an x separation as well would push the placeholder past its width for no
   * gain — repeated over a whole boundary, that is how a tree ends up hundreds of
   * pixels outside the core.
   */
  const placeholder = makeEntity('~tree/tree:0:root', 0, 0, 100, 100);
  const root = makeEntity('root', -200, 0, 60, 40);
  const sameBand = makeEntity('sameBand', 120, 10, 60, 40);
  const aboveBand = makeEntity('aboveBand', 20, -600, 60, 40);

  it('constrains only the blocks that this axis has to part', () => {
    const state = makeState([placeholder, root, sameBand, aboveBand]);
    const constraints = expansionConstraintsFor(
      state,
      makePlanar(['root', 'sameBand', 'aboveBand']),
      TREE,
      makeFace(['root', 'sameBand', 'aboveBand']),
      placeholder.id,
      'x'
    );

    const involved = constraints.map((c) =>
      c.kind === 'separation'
        ? [c.leftOrAbove, c.rightOrBelow].find((id) => id !== placeholder.id)
        : undefined
    );
    expect(involved).toEqual(['sameBand']);
  });

  it('constrains the whole boundary under the last-resort scope', () => {
    const state = makeState([placeholder, root, sameBand, aboveBand]);
    const constraints = expansionConstraintsFor(
      state,
      makePlanar(['root', 'sameBand', 'aboveBand']),
      TREE,
      makeFace(['root', 'sameBand', 'aboveBand']),
      placeholder.id,
      'x',
      'boundary'
    );

    const involved = constraints
      .map((c) =>
        c.kind === 'separation'
          ? [c.leftOrAbove, c.rightOrBelow].find((id) => id !== placeholder.id)
          : undefined
      )
      .sort();
    expect(involved).toEqual(['aboveBand', 'sameBand']);
  });

  it('never constrains the tree against its own root', () => {
    const state = makeState([placeholder, root, sameBand]);
    const constraints = expansionConstraintsFor(
      state,
      makePlanar(['root', 'sameBand']),
      TREE,
      makeFace(['root', 'sameBand']),
      placeholder.id,
      'x',
      'boundary'
    );
    for (const constraint of constraints) {
      if (constraint.kind === 'separation') {
        expect([constraint.leftOrAbove, constraint.rightOrBelow]).not.toContain('root');
      }
    }
  });
});

describe('corner placement offset (guide §17.2)', () => {
  // A 40x20 node at the origin, and a tree footprint centred on it.
  const core = makeEntity('root', 0, 0, 40, 20);
  const occupied = { minX: -50, minY: -30, maxX: 50, maxY: 30 };
  const clearance = 24;

  it('moves the footprint clear of the node, in the given direction', () => {
    // North: the footprint's bottom edge (30) must reach the node's top (-10)
    // less the clearance, so it travels 30 - (-34) = 64 upwards.
    expect(clearanceShift('N', core, occupied, clearance)).toEqual({ x: 0, y: -64 });
    expect(clearanceShift('S', core, occupied, clearance)).toEqual({ x: 0, y: 64 });
    // East and west work off the node's half-width of 20 instead: 50 + 44.
    expect(clearanceShift('E', core, occupied, clearance)).toEqual({ x: 94, y: 0 });
    expect(clearanceShift('W', core, occupied, clearance)).toEqual({ x: -94, y: 0 });
  });

  it('stays put when the footprint is already clear', () => {
    const away = { minX: 200, minY: 200, maxX: 300, maxY: 300 };
    expect(clearanceShift('E', core, away, clearance)).toEqual({ x: 0, y: 0 });
    expect(clearanceShift('S', core, away, clearance)).toEqual({ x: 0, y: 0 });
  });

  it('only ever moves along one axis', () => {
    for (const direction of ['N', 'S', 'E', 'W'] as const) {
      const shift = clearanceShift(direction, core, occupied, clearance);
      expect(shift.x === 0 || shift.y === 0).toBe(true);
    }
  });
});
