import type { Barrier, Gate, Layer, ScheduledGate, Wire } from './types.js';

/**
 * A step in the combined gate+barrier sequence.
 */
export type Step = { kind: 'gate'; gate: Gate } | { kind: 'barrier' };

/**
 * Place gates into time-step layers using ASAP (as‑soon‑as‑possible) scheduling.
 *
 * Each wire tracks the next free time step.  A gate is placed at the
 * maximum next-free value across all its wires, then advances those
 * wires to the next time step.
 *
 * Barriers force a new layer.
 */
export function schedule(wires: Wire[], steps: Step[]): Layer[] {
  const nextFree = new Map<string, number>();
  for (const w of wires) {
    nextFree.set(w.name, 0);
  }

  const layers: Layer[] = [[]];

  for (const step of steps) {
    if (step.kind === 'barrier') {
      layers.push([{ type: 'barrier' }]);
      layers.push([]);
      // Advance all wires past the barrier so subsequent gates
      // are placed after it
      for (const w of wires) {
        nextFree.set(w.name, layers.length - 1);
      }
      continue;
    }

    const gate = step.gate;
    const scheduledGate: ScheduledGate = {
      name: gate.name,
      params: gate.params,
      wireRefs: gate.wireRefs,
      captureTarget: gate.captureTarget,
      conditionCbit: gate.conditionCbit,
    };

    const t = Math.max(
      ...gate.wireRefs.map((ref) => {
        const ft = nextFree.get(ref.wire);
        if (ft === undefined) {
          throw new Error(
            `Wire "${ref.wire}" referenced in gate "${gate.name}" was not declared`
          );
        }
        return ft;
      })
    );

    while (layers.length <= t) {
      layers.push([]);
    }

    layers[t].push(scheduledGate);

    for (const ref of gate.wireRefs) {
      nextFree.set(ref.wire, t + 1);
    }
  }

  // Remove empty trailing layers
  while (layers.length > 0 && layers[layers.length - 1].length === 0) {
    layers.pop();
  }

  return layers;
}