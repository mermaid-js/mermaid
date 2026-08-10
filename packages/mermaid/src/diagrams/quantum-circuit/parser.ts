import type { QuantumCircuit } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { QuantumCircuitDB } from './db.js';
import { schedule } from './scheduler.js';
import type { Step } from './scheduler.js';
import type { ClassicalWire, Wire, WireRef } from './types.js';

// Gates that have no control wires — zero-control is not allowed on any wire.
const ZERO_CONTROL_FORBIDDEN = new Set(['SWAP']);

// For gates with a defined number of control wires, map gate name → control count.
// Wires beyond this count are targets and may not carry zero-control.
const GATE_CONTROL_COUNT: Record<string, number> = {
  CNOT: 1,
  CX: 1,
  CZ: 1,
  CCX: 2,
  CCZ: 2,
  CSWAP: 1,
};

/**
 * Resolve a wire reference string to a canonical wire name.
 *
 * If `id` is a decimal integer string, it is treated as a 0-based index into
 * the current wire list.  Wires are auto-created (as q0, q1, …) up to the
 * requested index when they do not yet exist.
 *
 * Otherwise `id` is a wire label and is auto-created on first use.
 */
function resolveWire(id: string, wires: Wire[], wireMap: Map<string, Wire>): string {
  if (/^\d+$/.test(id)) {
    const idx = parseInt(id, 10);
    while (wires.length <= idx) {
      const name = `q${wires.length}`;
      const w: Wire = { name, initialState: '0' };
      wireMap.set(name, w);
      wires.push(w);
    }
    return wires[idx].name;
  }
  if (!wireMap.has(id)) {
    const w: Wire = { name: id, initialState: '0' };
    wireMap.set(id, w);
    wires.push(w);
  }
  return id;
}

const populate = (ast: QuantumCircuit, db: QuantumCircuitDB) => {
  populateCommonDb(ast, db);

  const direction = ast.direction ?? 'LR';
  if (direction !== 'LR' && direction !== 'TD') {
    throw new Error(`Invalid direction: ${String(direction)}. Expected LR or TD.`);
  }
  db.setDirection(direction);

  // ── Collect quantum wires ─────────────────────────────────────────────
  const wireMap = new Map<string, Wire>();
  const wires: Wire[] = [];

  if (ast.wires) {
    for (const ws of ast.wires.wires) {
      const wire: Wire = {
        name: ws.name,
        initialState: ws.initialState?.value.replace(/^\(|\)$/g, '') ?? '0',
      };
      if (wireMap.has(wire.name)) {
        throw new Error(`Duplicate wire name: "${wire.name}"`);
      }
      wireMap.set(wire.name, wire);
      wires.push(wire);
    }
  }

  // ── Collect classical bits ────────────────────────────────────────────
  const cbitSet = new Set<string>();
  const cbits: ClassicalWire[] = [];

  if (ast.cbits) {
    for (const name of ast.cbits.cbits) {
      if (cbitSet.has(name)) {
        throw new Error(`Duplicate classical bit name: "${name}"`);
      }
      cbitSet.add(name);
      cbits.push({ name });
    }
  }

  // ── Flatten gates and barriers into a combined, document-ordered list ─
  const steps: Step[] = [];

  const items: (
    | { offset: number; type: 'gate'; gateIdx: number }
    | { offset: number; type: 'barrier' }
  )[] = [];

  for (const [i, g] of ast.gates.entries()) {
    const offset = g.$cstNode?.offset ?? 0;
    items.push({ offset, type: 'gate', gateIdx: i });
  }
  for (const b of ast.barrier) {
    const offset = b.$cstNode?.offset ?? 0;
    items.push({ offset, type: 'barrier' });
  }

  items.sort((a, b) => a.offset - b.offset);

  for (const item of items) {
    if (item.type === 'barrier') {
      steps.push({ kind: 'barrier' });
      continue;
    }

    const gd = ast.gates[item.gateIdx];

    // ── Build wire refs, resolving integer indices to wire names ──────
    const wireRefs: WireRef[] = gd.wireRefs.map((wr) => {
      const rawId = wr.wire ?? String(wr.wireIdx ?? 0);
      const resolved = resolveWire(rawId, wires, wireMap);
      return { wire: resolved, zeroControl: wr.zero !== undefined };
    });

    // ── Zero-control validation ───────────────────────────────────────
    if (ZERO_CONTROL_FORBIDDEN.has(gd.name)) {
      if (wireRefs.some((r) => r.zeroControl)) {
        throw new Error(
          `Gate "${gd.name}" has no control wires; Zero-control (!) is not allowed on ${gd.name}.`
        );
      }
    } else if (wireRefs.length === 1) {
      if (wireRefs[0].zeroControl) {
        throw new Error(
          `Gate "${gd.name}" is a single-qubit gate. Zero-control (!) is only allowed on control wires.`
        );
      }
    } else {
      const controlCount = GATE_CONTROL_COUNT[gd.name];
      if (controlCount !== undefined) {
        // Known multi-qubit gate: validate against explicit control positions.
        for (let j = 0; j < wireRefs.length; j++) {
          if (wireRefs[j].zeroControl && j >= controlCount) {
            throw new Error(
              `Gate "${gd.name}" has zero-control (!) on wire "${wireRefs[j].wire}" which is not a control wire. Zero-control is only allowed on control wires.`
            );
          }
        }
      } else {
        // Custom multi-qubit gate: last wire is treated as target.
        const lastIdx = wireRefs.length - 1;
        if (wireRefs[lastIdx].zeroControl) {
          throw new Error(
            `Gate "${gd.name}" has zero-control (!) on wire "${wireRefs[lastIdx].wire}" which is the target (last wire). Zero-control is only allowed on control wires.`
          );
        }
      }
    }

    // ── Validate classical capture / condition references ─────────────
    if (gd.captureTarget && !cbitSet.has(gd.captureTarget)) {
      throw new Error(
        `Measurement capture target "${gd.captureTarget}" is not a declared classical bit.`
      );
    }
    if (gd.conditionCbit && !cbitSet.has(gd.conditionCbit)) {
      throw new Error(
        `Condition classical bit "${gd.conditionCbit}" is not a declared classical bit.`
      );
    }

    steps.push({
      kind: 'gate',
      gate: {
        name: gd.name,
        params: gd.params?.value.replace(/^\(|\)$/g, ''),
        wireRefs,
        captureTarget: gd.captureTarget || undefined,
        conditionCbit: gd.conditionCbit || undefined,
      },
    });
  }

  db.setWires(wires);
  db.setCbits(cbits);

  // Run the scheduling algorithm
  const layers = schedule(wires, steps);
  db.setLayers(layers);

  log.debug('quantum circuit layers:', layers);
};

export const parser: ParserDefinition = {
  // @ts-expect-error - QuantumCircuitDB is not assignable to DiagramDB
  parser: { yy: undefined },
  parse: async (input: string): Promise<void> => {
    const ast: QuantumCircuit = await parse('quantumCircuit', input);
    const db = parser.parser?.yy;
    if (!(db instanceof QuantumCircuitDB)) {
      throw new Error(
        'parser.parser?.yy was not a QuantumCircuitDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }
    log.debug(ast);
    populate(ast, db);
  },
};
