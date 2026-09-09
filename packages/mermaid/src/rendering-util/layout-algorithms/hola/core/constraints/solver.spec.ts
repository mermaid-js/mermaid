import { describe, expect, it } from 'vitest';
import { ConstraintSystem, rotateConstraint } from './solver.js';
import { alignment, separation } from './types.js';
import { Variable, VpscConstraint, solveVpsc } from './vpsc.js';

const positions = (entries: [string, number, number][]): Map<string, { x: number; y: number }> =>
  new Map(entries.map(([id, x, y]) => [id, { x, y }]));

describe('VPSC', () => {
  it('leaves an already feasible layout untouched', () => {
    const a = new Variable(0);
    const b = new Variable(100);
    solveVpsc([a, b], [new VpscConstraint(a, b, 50)]);
    expect(a.position()).toBeCloseTo(0, 6);
    expect(b.position()).toBeCloseTo(100, 6);
  });

  it('splits a violated separation symmetrically for equal weights', () => {
    const a = new Variable(0);
    const b = new Variable(10);
    solveVpsc([a, b], [new VpscConstraint(a, b, 50)]);
    expect(b.position() - a.position()).toBeCloseTo(50, 6);
    // Weighted mean is preserved: both move by 20 in opposite directions.
    expect((a.position() + b.position()) / 2).toBeCloseTo(5, 6);
  });

  it('moves the lighter variable further', () => {
    const heavy = new Variable(0, 100);
    const light = new Variable(10, 1);
    solveVpsc([heavy, light], [new VpscConstraint(heavy, light, 50)]);
    expect(light.position() - heavy.position()).toBeCloseTo(50, 6);
    expect(Math.abs(heavy.position() - 0)).toBeLessThan(1);
    expect(Math.abs(light.position() - 10)).toBeGreaterThan(38);
  });

  it('propagates through a chain of separations', () => {
    const vs = [new Variable(0), new Variable(0), new Variable(0)];
    const cs = [new VpscConstraint(vs[0], vs[1], 10), new VpscConstraint(vs[1], vs[2], 10)];
    solveVpsc(vs, cs);
    expect(vs[1].position() - vs[0].position()).toBeGreaterThanOrEqual(10 - 1e-6);
    expect(vs[2].position() - vs[1].position()).toBeGreaterThanOrEqual(10 - 1e-6);
    expect((vs[0].position() + vs[1].position() + vs[2].position()) / 3).toBeCloseTo(0, 6);
  });

  it('honours equality constraints exactly', () => {
    const a = new Variable(0);
    const b = new Variable(80);
    solveVpsc([a, b], [new VpscConstraint(a, b, 0, true)]);
    expect(b.position() - a.position()).toBeCloseTo(0, 9);
    expect(a.position()).toBeCloseTo(40, 6);
  });

  it('re-opens a block when the optimum lies apart', () => {
    // c1 forces b to the right of a, but their desired positions are already
    // far apart, so the block created for a violated third constraint must be
    // split again rather than dragging b along.
    const a = new Variable(0);
    const b = new Variable(1000);
    const c = new Variable(5);
    const cs = [new VpscConstraint(a, c, 10), new VpscConstraint(c, b, 10)];
    solveVpsc([a, b, c], cs);
    expect(c.position() - a.position()).toBeGreaterThanOrEqual(10 - 1e-6);
    expect(b.position()).toBeCloseTo(1000, 6);
  });

  it('marks a cyclic constraint set unsatisfiable instead of looping', () => {
    const a = new Variable(0);
    const b = new Variable(0);
    const result = solveVpsc([a, b], [new VpscConstraint(a, b, 10), new VpscConstraint(b, a, 10)]);
    expect(result.feasible).toBe(false);
    expect(result.unsatisfiable.length).toBeGreaterThan(0);
  });
});

describe('ConstraintSystem', () => {
  it('projects onto mixed alignment and separation constraints', () => {
    const system = new ConstraintSystem();
    const nodes = positions([
      ['a', 0, 0],
      ['b', 5, 40],
    ]);
    system.add(alignment('x', 'a', 'b', 'node-configuration'));
    system.add(separation('y', 'a', 'b', 100, 'node-configuration'));

    const result = system.project(nodes);

    expect(result.feasible).toBe(true);
    expect(nodes.get('a')!.x).toBeCloseTo(nodes.get('b')!.x, 6);
    expect(nodes.get('b')!.y - nodes.get('a')!.y).toBeGreaterThanOrEqual(100 - 1e-6);
  });

  it('reports infeasible additions without mutating state', () => {
    const system = new ConstraintSystem();
    const nodes = positions([
      ['a', 0, 0],
      ['b', 50, 0],
    ]);
    system.add(separation('x', 'a', 'b', 50, 'node-configuration'));
    const before = system.size;

    const feasible = system.isFeasible(nodes, [
      separation('x', 'b', 'a', 50, 'node-configuration'),
    ]);

    expect(feasible).toBe(false);
    expect(system.size).toBe(before);
    expect(nodes.get('a')!.x).toBe(0);
    expect(nodes.get('b')!.x).toBe(50);
  });

  it('restores positions and constraints from a snapshot', () => {
    const system = new ConstraintSystem();
    const nodes = positions([
      ['a', 0, 0],
      ['b', 10, 0],
    ]);
    const snapshot = system.snapshot(nodes);

    system.add(separation('x', 'a', 'b', 300, 'tree-placement'));
    system.project(nodes);
    expect(nodes.get('b')!.x - nodes.get('a')!.x).toBeGreaterThan(200);

    system.restore(snapshot, nodes);

    expect(system.size).toBe(0);
    expect(nodes.get('a')!.x).toBe(0);
    expect(nodes.get('b')!.x).toBe(10);
  });

  it('keeps earlier constraints satisfied when later ones are added', () => {
    const system = new ConstraintSystem();
    const nodes = positions([
      ['a', 0, 0],
      ['b', 0, 0],
      ['c', 0, 0],
    ]);
    system.add(alignment('y', 'a', 'b', 'node-configuration'));
    system.project(nodes);
    system.add(separation('x', 'b', 'c', 120, 'chain-configuration'));
    system.project(nodes);

    expect(nodes.get('a')!.y).toBeCloseTo(nodes.get('b')!.y, 6);
    expect(nodes.get('c')!.x - nodes.get('b')!.x).toBeGreaterThanOrEqual(120 - 1e-6);
  });
});

describe('rotateConstraint', () => {
  it('maps an x alignment to a y alignment and back under cw rotation', () => {
    const rotated = rotateConstraint(alignment('x', 'a', 'b', 'node-configuration'), 'cw');
    expect(rotated.kind).toBe('alignment');
    expect(rotated.axis).toBe('y');
  });

  it('reverses a horizontal separation into a vertical one under cw rotation', () => {
    const rotated = rotateConstraint(
      separation('x', 'left', 'right', 30, 'node-configuration'),
      'cw'
    );
    expect(rotated.axis).toBe('y');
    if (rotated.kind !== 'separation') {
      throw new Error('expected separation');
    }
    // clockwise maps (x, y) → (y, −x): what was further right becomes further up.
    expect(rotated.leftOrAbove).toBe('right');
    expect(rotated.rightOrBelow).toBe('left');
    expect(rotated.gap).toBe(30);
  });

  it('is consistent with rotating the coordinates themselves', () => {
    const nodes = positions([
      ['a', 0, 0],
      ['b', 0, 0],
    ]);
    const system = new ConstraintSystem();
    system.add(separation('x', 'a', 'b', 60, 'node-configuration'));
    system.project(nodes);
    const a = nodes.get('a')!;
    const b = nodes.get('b')!;

    // Rotate coordinates clockwise and the constraints with them.
    const rotate = (p: { x: number; y: number }) => ({ x: p.y, y: -p.x });
    const rotatedNodes = positions([
      ['a', rotate(a).x, rotate(a).y],
      ['b', rotate(b).x, rotate(b).y],
    ]);
    system.rotate90('cw');

    expect(system.isFeasible(rotatedNodes)).toBe(true);
    const result = system.project(rotatedNodes);
    expect(result.feasible).toBe(true);
    expect(rotatedNodes.get('a')!.y - rotatedNodes.get('b')!.y).toBeCloseTo(60, 5);
  });
});
