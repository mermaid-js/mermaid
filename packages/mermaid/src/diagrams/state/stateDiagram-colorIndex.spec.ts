/**
 * Container colour slots for state diagrams: `dataFetcher` assigns the slot, `clusters.js`
 * stamps it as `data-color-id`, and `state/styles.js` maps it to a border and a title tint.
 *
 * Two rules have to hold together, and they pull in opposite directions:
 *
 *  1. Nested composites must differ, or a machine nested three deep reads as one box.
 *  2. The concurrency regions of a single composite must match, or one composite split by
 *     `--` reads as several composites sitting side by side.
 *
 * Both fail silently -- the diagram still renders, just with the wrong colours -- so pin
 * the assignment here rather than relying on a screenshot to notice.
 */
import { describe, expect, it, beforeEach } from 'vitest';
// @ts-expect-error No types available for JISON
import stateDiagram, { parser } from './parser/stateDiagram.jison';
import { StateDB } from './stateDb.js';

describe('state diagram colour slots', () => {
  let stateDb: StateDB;

  beforeEach(() => {
    stateDb = new StateDB(2);
    parser.yy = stateDb;
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
  });

  const parse = (diagram: string) => {
    parser.parse(diagram);
    return stateDb.getData().nodes;
  };

  const slots = (diagram: string) =>
    new Map(parse(diagram).map((node) => [node.id, node.colorIndex]));

  /**
   * Concurrency regions are matched on shape, not on id. Only the regions that follow a
   * `--` keep the `divider-id-N` name; `stateDb.docTranslator` gives the trailing one a
   * random id, and an id prefix match would also pick up each region's `_start` child.
   */
  const regionSlots = (nodes: { shape: string; parentId?: string; colorIndex?: number }[]) =>
    nodes.filter((node) => node.shape === 'divider');

  it('gives each composite its own slot, in containment order', () => {
    const byId = slots(`stateDiagram-v2
      [*] --> Boot
      state Boot {
        [*] --> Firmware
        state Kernel {
          [*] --> Scheduler
          state Drivers {
            [*] --> Probe
          }
        }
      }
      Boot --> Running
      state Running {
        [*] --> Serving
      }
    `);
    // Pre-order: a composite is numbered before the composites it contains, so depth is
    // what separates the colours rather than declaration order across the whole file.
    expect(byId.get('Boot')).toBe(0);
    expect(byId.get('Kernel')).toBe(1);
    expect(byId.get('Drivers')).toBe(2);
    expect(byId.get('Running')).toBe(3);
  });

  it('leaves plain states unslotted, so only containers are painted', () => {
    const byId = slots(`stateDiagram-v2
      state Outer {
        [*] --> Inner
        Inner --> Done
      }
    `);
    expect(byId.get('Outer')).toBe(0);
    expect(byId.get('Inner')).toBeUndefined();
    expect(byId.get('Done')).toBeUndefined();
  });

  it('gives every concurrency region of one composite the same slot', () => {
    const nodes = parse(`stateDiagram-v2
      state Active {
        [*] --> NumLockOff
        --
        [*] --> CapsLockOff
        --
        [*] --> ScrollLockOff
      }
    `);
    const byId = new Map(nodes.map((node) => [node.id, node.colorIndex]));
    const regions = regionSlots(nodes).map((node) => node.colorIndex);

    // Counted, because two `--` produce three regions: one per separator plus the trailing
    // remainder. Asserting only on the distinct values would pass if a region went missing.
    expect(regions).toHaveLength(3);
    expect(new Set(regions).size).toBe(1);
    // ...and it is the composite's own slot, not a fresh one. The regions are synthetic --
    // the author wrote one composite -- so they are drawn as parts of it rather than as
    // something with a colour of its own.
    expect(byId.get('Active')).toBe(0);
    expect(regions[0]).toBe(0);
  });

  it('does not shift later composites when a divider is added', () => {
    // The reason regions reuse the parent's slot rather than taking one. Spending slots on
    // containers the author never wrote meant adding a `--` recoloured everything after it.
    const withoutDivider = slots(`stateDiagram-v2
      state First {
        [*] --> A
      }
      state Second {
        [*] --> B
      }
    `);
    stateDb = new StateDB(2);
    parser.yy = stateDb;
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
    const withDivider = slots(`stateDiagram-v2
      state First {
        [*] --> A
        --
        [*] --> C
      }
      state Second {
        [*] --> B
      }
    `);

    expect(withoutDivider.get('First')).toBe(withDivider.get('First'));
    expect(withoutDivider.get('Second')).toBe(withDivider.get('Second'));
    expect(withDivider.get('Second')).toBe(1);
  });

  it("carries a styled composite's opt-out into its concurrency regions", () => {
    // The regions render in a sibling layer, so the author's `.pinned > *` rule cannot
    // reach them. Were they to keep a palette slot, the composite would be painted by the
    // author and its own regions from the palette -- one container, two sources, which is
    // the split `userStyled` exists to prevent.
    const nodes = parse(`stateDiagram-v2
      classDef pinned fill:#111827,stroke:#F59E0B
      state Active {
        [*] --> A
        --
        [*] --> B
      }
      class Active pinned
    `);
    const byId = new Map(nodes.map((node) => [node.id, node.colorIndex]));
    expect(byId.get('Active')).toBeUndefined();
    const regions = regionSlots(nodes);
    expect(regions).toHaveLength(2);
    expect(regions.every((region) => region.colorIndex === undefined)).toBe(true);
  });

  it('does not share one slot between two separately divided composites', () => {
    // The shared slot is keyed by parent. Keying it globally, or by nothing at all, would
    // paint every concurrency region in the diagram the same colour.
    const nodes = parse(`stateDiagram-v2
      state First {
        [*] --> A
        --
        [*] --> B
      }
      state Second {
        [*] --> C
        --
        [*] --> D
      }
    `);
    const byId = new Map(nodes.map((node) => [node.id, node.colorIndex]));
    const regions = regionSlots(nodes);

    expect(byId.get('First')).not.toBe(byId.get('Second'));
    expect(regions).toHaveLength(4);
    // Two composites, two regions each: two distinct region colours, not one and not four.
    expect(new Set(regions.map((node) => node.colorIndex)).size).toBe(2);
    // And the pairing is by parent, not by declaration order -- each composite's regions
    // carry that composite's own slot.
    const byParent = new Map<string, Set<number | undefined>>();
    for (const region of regions) {
      const key = region.parentId ?? 'root';
      byParent.set(key, (byParent.get(key) ?? new Set()).add(region.colorIndex));
    }
    expect([...byParent.values()].map((set) => set.size)).toEqual([1, 1]);
    expect(byParent.get('First')).toEqual(new Set([byId.get('First')]));
    expect(byParent.get('Second')).toEqual(new Set([byId.get('Second')]));
  });

  it('leaves a composite with its own classDef unstamped, but still spends its slot', () => {
    const byId = slots(`stateDiagram-v2
      classDef pinned fill:#111827,stroke:#F59E0B
      state First {
        [*] --> A
      }
      state Second {
        [*] --> B
      }
      state Third {
        [*] --> C
      }
      class Second pinned
    `);
    expect(byId.get('First')).toBe(0);
    // Unstamped, so no `[data-color-id]` rule can match it and the author's class -- which
    // is emitted `!important` -- is the only thing painting the container.
    expect(byId.get('Second')).toBeUndefined();
    // The slot is still consumed: `Third` keeps the colour it would have had anyway, so
    // styling one composite does not recolour every composite after it.
    expect(byId.get('Third')).toBe(2);
  });

  it('leaves a composite with its own style statement unstamped', () => {
    const byId = slots(`stateDiagram-v2
      state First {
        [*] --> A
      }
      state Second {
        [*] --> B
      }
      style Second fill:#111827
    `);
    expect(byId.get('First')).toBe(0);
    expect(byId.get('Second')).toBeUndefined();
  });

  it('spends one slot on a composite named twice, so the cycle does not skip', () => {
    // `dataFetcher` runs once per relation endpoint, so a composite on both sides of two
    // transitions is visited more than once. Taking a slot each time would leave gaps in
    // the cycle and shift every later container's colour.
    const byId = slots(`stateDiagram-v2
      [*] --> Loop
      state Loop {
        [*] --> Spin
      }
      Loop --> Loop
      Loop --> Exit
      state Exit {
        [*] --> Bye
      }
    `);
    expect(byId.get('Loop')).toBe(0);
    expect(byId.get('Exit')).toBe(1);
  });
});
