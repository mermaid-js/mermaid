import { describe, expect, it } from 'vitest';
import { schedule } from './scheduler.js';
import type { Step } from './scheduler.js';
import type { Gate, Wire } from './types.js';

const W = (name: string): Wire => ({ name, initialState: '0' });
const G = (name: string, ...wires: string[]): Gate => ({
  name,
  wireRefs: wires.map((w) => ({ wire: w, zeroControl: false })),
});
const g = (g: Gate): Step => ({ kind: 'gate', gate: g }) as Step;
const b = (): Step => ({ kind: 'barrier' });

describe('quantum circuit scheduler', () => {
  it('bell state preparation', () => {
    const wires = [W('q0'), W('q1')];
    const steps: Step[] = [g(G('H', 'q0')), g(G('CNOT', 'q0', 'q1')), g(G('M', 'q0')), g(G('M', 'q1'))];
    const result = schedule(wires, steps);
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(1);
    expect(result[1]).toHaveLength(1);
    expect(result[2]).toHaveLength(2);
  });

  it('parallel single-qubit gates share a layer', () => {
    const wires = [W('q0'), W('q1')];
    const steps: Step[] = [g(G('H', 'q0')), g(G('H', 'q1'))];
    const result = schedule(wires, steps);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
  });

  it('sequential gates on same wire go to separate layers', () => {
    const wires = [W('q0')];
    const steps: Step[] = [g(G('H', 'q0')), g(G('X', 'q0')), g(G('M', 'q0'))];
    const result = schedule(wires, steps);
    expect(result).toHaveLength(3);
  });

  it('barrier forces a new layer', () => {
    const wires = [W('q0'), W('q1')];
    const steps: Step[] = [
      g(G('H', 'q0')),
      g(G('H', 'q1')),
      b(),
      g(G('CNOT', 'q0', 'q1')),
      b(),
      g(G('M', 'q0')),
      g(G('M', 'q1')),
    ];
    const result = schedule(wires, steps);
    // H,H | barrier | CNOT | barrier | M,M
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveLength(2);
    expect(result[1][0]).toMatchObject({ type: 'barrier' });
    expect(result[2]).toHaveLength(1);
    expect(result[3][0]).toMatchObject({ type: 'barrier' });
    expect(result[4]).toHaveLength(2);
  });

  it('toffoli spans correctly', () => {
    const wires = [W('a'), W('b'), W('c')];
    const steps: Step[] = [
      g(G('H', 'a')),
      g(G('H', 'b')),
      g(G('CCX', 'a', 'b', 'c')),
      g(G('M', 'a')),
      g(G('M', 'b')),
      g(G('M', 'c')),
    ];
    const result = schedule(wires, steps);
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(2);
    expect(result[1]).toHaveLength(1);
    expect(result[2]).toHaveLength(3);
  });

  it('throws on undeclared wire', () => {
    const wires = [W('q0')];
    const steps: Step[] = [g(G('CNOT', 'q0', 'q99'))];
    expect(() => schedule(wires, steps)).toThrow('was not declared');
  });

  it('handles empty circuit', () => {
    const wires = [W('q0')];
    const steps: Step[] = [];
    const result = schedule(wires, steps);
    expect(result).toHaveLength(0);
  });
});