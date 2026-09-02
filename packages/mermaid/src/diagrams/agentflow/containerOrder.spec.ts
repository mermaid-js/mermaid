import { describe, expect, it, beforeEach } from 'vitest';
import * as configApi from '../../config.js';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../logger.js';
import { KIND_COUNT } from './colorSlots.js';

/**
 * Container palette slots follow the order the author declared containers in.
 *
 * Asserted through a real parse rather than against a hand-built node array, which is what
 * let the bug through: `colorSlots.spec.ts` numbers the array it is given, so it passed
 * while `getData()` handed over a reversed one. `getData()` walks `subGraphs` in reverse,
 * and `subGraphs` is itself in completion order — a nested container closes before its
 * parent — so neither that array nor its reverse is source order.
 */
const slotsById = async (text: string) => {
  const db = (await Diagram.fromText(text)).db as unknown as {
    getData: () => { nodes: { id: string; colorIndex?: number }[] };
  };
  const data = db.getData();
  return new Map(
    data.nodes.filter((n) => n.colorIndex !== undefined).map((n) => [String(n.id), n.colorIndex!])
  );
};

describe('agentflow container order', () => {
  beforeEach(() => {
    configApi.setSiteConfig({});
    configApi.reset();
    // A palette has to be active or every slot is inert and the order is unobservable.
    configApi.setSiteConfig({ theme: 'redux-color' } as never);
    addDiagrams();
    setLogLevel('fatal');
  });

  it('gives the first declared container the first container slot', async () => {
    const slots = await slotsById(`agentflow-beta TB
      flow first["First"]
        a["a"]
      end
      flow second["Second"]
        b["b"]
      end
      flow third["Third"]
        c["c"]
      end
    `);

    expect(slots.get('first')).toBe(KIND_COUNT);
    expect(slots.get('second')).toBe(KIND_COUNT + 1);
    expect(slots.get('third')).toBe(KIND_COUNT + 2);
  });

  it('numbers a parent before the container nested inside it', async () => {
    // Completion order would put `inner` first, because it closes first. Source order is
    // what a reader sees, so it is what the colours follow.
    const slots = await slotsById(`agentflow-beta TB
      flow outer["Outer"]
        flow inner["Inner"]
          a["a"]
        end
      end
      flow sibling["Sibling"]
        b["b"]
      end
    `);

    expect(slots.get('outer')).toBe(KIND_COUNT);
    expect(slots.get('inner')).toBe(KIND_COUNT + 1);
    expect(slots.get('sibling')).toBe(KIND_COUNT + 2);
  });

  it('keeps a collapsed container in the sequence', async () => {
    // A collapsed container is drawn as a node but still holds its slot, so collapsing one
    // does not reshuffle the colours of the containers after it.
    const slots = await slotsById(`agentflow-beta TB
      flow one["One"]
        a["a"]
      end
      flow two["Two"]
        b["b"]
      end
      two@{ view: "collapsed" }
      flow three["Three"]
        c["c"]
      end
    `);

    expect(slots.get('one')).toBe(KIND_COUNT);
    expect(slots.get('two')).toBe(KIND_COUNT + 1);
    expect(slots.get('three')).toBe(KIND_COUNT + 2);
  });
});
