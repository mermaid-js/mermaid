import { describe, it, expect, beforeEach } from 'vitest';
import type { Node, Edge } from '../../rendering-util/types.js';
import { bpmnIcons } from '../../rendering-util/rendering-elements/shapes/bpmnIcons.js';
import { db } from './bpmnDb.js';
import { EVENT_TRIGGERS, TASK_TYPES, TRIGGERS_BY_POSITION, positionsFor } from './types.js';

/** An event at a position, with a host where the position needs one. */
const eventSource = (position: string, trigger?: string, id = 'e'): string => {
  const statement = `${position}${trigger ? ` ${trigger}` : ''} ${id} "E"`;
  return position === 'boundary'
    ? `bpmn-beta LR\n  lane "L"\n    task host "H"\n      ${statement}`
    : `bpmn-beta LR\n  lane "L"\n    ${statement}`;
};

const PACK = new Set(Object.keys(bpmnIcons.icons));

interface Drawn {
  shape?: string;
  icon?: string;
}

function build(source: string): { nodes: Node[]; edges: Edge[]; layoutAlgorithm: string } {
  db.clear();
  db.parse(source);
  return db.getData() as unknown as { nodes: Node[]; edges: Edge[]; layoutAlgorithm: string };
}

const nodeById = (nodes: Node[], id: string): Node & Drawn => nodes.find((n) => n.id === id)!;

const glyph = (node: Node & Drawn) => node.icon?.replace(/^bpmn:/, '');

describe('bpmnDb', () => {
  beforeEach(() => db.clear());

  it('lays out through the swimlane engine, which is what makes lanes constrain placement', () => {
    expect(build('bpmn-beta LR\n  lane "L"\n    task t "T"').layoutAlgorithm).toBe('swimlane');
  });

  describe('events', () => {
    it.each([
      ['start', 'bpmn-start'],
      ['intermediate', 'bpmn-intermediate'],
      ['boundary', 'bpmn-boundary'],
      ['end', 'bpmn-end'],
    ])('draws a %s event with the %s shape', (keyword, shape) => {
      // Message is the one trigger the notation draws at every position.
      const { nodes } = build(eventSource(keyword, 'message'));
      expect(nodeById(nodes, 'e').shape).toBe(shape);
    });

    // The position and the glyph are chosen independently, over the pairs the notation
    // draws. An earlier design keyed a single shape name off both and silently fell back
    // to a start event for the pairs it had no name for.
    const marked = (position: keyof typeof TRIGGERS_BY_POSITION) =>
      TRIGGERS_BY_POSITION[position].filter((t) => t !== 'none');

    it.each(marked('start'))('gives a start event the %s glyph', (trigger) => {
      const { nodes } = build(`bpmn-beta LR\n  lane "L"\n    start ${trigger} e "E"`);
      const node = nodeById(nodes, 'e');
      expect(node.shape).toBe('bpmn-start');
      expect(glyph(node)).toBe(trigger);
    });

    it.each(marked('end'))(
      'gives an end event the %s glyph without changing its ring',
      (trigger) => {
        const { nodes } = build(`bpmn-beta LR\n  lane "L"\n    end e "E"`);
        expect(nodeById(nodes, 'e').shape).toBe('bpmn-end');
        const withTrigger = build(`bpmn-beta LR\n  lane "L"\n    end ${trigger} e "E"`);
        expect(nodeById(withTrigger.nodes, 'e').shape).toBe('bpmn-end');
        expect(glyph(nodeById(withTrigger.nodes, 'e'))).toBe(trigger);
      }
    );

    it('leaves a plain event without a glyph', () => {
      const { nodes } = build('bpmn-beta LR\n  lane "L"\n    start none e "E"');
      expect(nodeById(nodes, 'e').icon).toBeUndefined();
    });

    describe('a trigger is refused where the notation does not draw it', () => {
      for (const [position, allowed] of Object.entries(TRIGGERS_BY_POSITION)) {
        it(`accepts each trigger a ${position} event carries`, () => {
          for (const trigger of allowed) {
            expect(
              () => build(eventSource(position, trigger)),
              `${position} ${trigger}`
            ).not.toThrow();
          }
        });

        it(`refuses the rest at a ${position} event`, () => {
          const refused = EVENT_TRIGGERS.filter((t) => !(allowed as readonly string[]).includes(t));
          expect(refused.length).toBeGreaterThan(0);
          for (const trigger of refused) {
            expect(() => build(eventSource(position, trigger)), `${position} ${trigger}`).toThrow(
              /BPMN error/
            );
          }
        });
      }

      it('says where the trigger it refused does belong', () => {
        expect(() => build(eventSource('start', 'terminate'))).toThrow(
          'a start event cannot carry the terminate trigger. The notation draws terminate on end events.'
        );
      });

      it('asks an event that must name its trigger to name one', () => {
        expect(() => build(eventSource('boundary'))).toThrow(
          'a boundary event must name what triggers it.'
        );
      });

      it('names the line the refused event is written on', () => {
        expect(() => build(eventSource('start', 'link'))).toThrow('at line 3');
      });
    });
  });

  describe('gateways', () => {
    it.each([
      ['xor', 'exclusive'],
      ['and', 'parallel-gateway'],
      ['or', 'inclusive'],
      ['event-gateway', 'event-based'],
      ['complex', 'complex'],
    ])('draws a %s gateway with the %s glyph', (keyword, expected) => {
      const { nodes } = build(`bpmn-beta LR\n  lane "L"\n    ${keyword} g "G"`);
      const node = nodeById(nodes, 'g');
      expect(node.shape).toBe('bpmn-gateway');
      expect(glyph(node)).toBe(expected);
    });
  });

  describe('activities', () => {
    it.each(TASK_TYPES)('gives a %s task its glyph', (type) => {
      const { nodes } = build(`bpmn-beta LR\n  lane "L"\n    ${type} task t "T"`);
      const node = nodeById(nodes, 't');
      expect(node.shape).toBe('bpmn-activity');
      expect(glyph(node)).toBe(type);
    });

    it('marks a subprocess with its own glyph', () => {
      const { nodes } = build('bpmn-beta LR\n  lane "L"\n    subprocess s "S"');
      expect(glyph(nodeById(nodes, 's'))).toBe('subprocess');
    });
  });

  describe('artifacts', () => {
    it.each([
      ['data d "D"', 'd', 'bpmn-data'],
      ['data-store ds "S"', 'ds', 'bpmn-data-store'],
      ['note n "N"', 'n', 'bpmn-annotation'],
    ])('draws %s with the %s shape', (statement, id, shape) => {
      const { nodes } = build(`bpmn-beta LR\n  lane "L"\n    ${statement}`);
      expect(nodeById(nodes, id).shape).toBe(shape);
    });
  });

  // The structural guard the old design lacked: if the grammar can name it, the pack has
  // to be able to draw it. Two gateway glyphs were once referenced but never defined, so
  // those gateways rendered as an empty diamond.
  it('emits only glyphs the icon pack actually defines', () => {
    const statements = [
      ...EVENT_TRIGGERS.filter((t) => t !== 'none').map(
        // Each trigger is drawn where the notation allows it.
        (t) => `${positionsFor(t)[0]} ${t} e_${t} "E"`
      ),
      ...TASK_TYPES.map((t) => `${t} task t_${t} "T"`),
      ...['xor', 'and', 'or', 'event-gateway', 'complex'].map((g) => `${g} g_${g} "G"`),
      'subprocess sub "S"',
    ];
    const { nodes } = build(
      `bpmn-beta LR\n  lane "L"\n${statements.map((s) => `    ${s}`).join('\n')}`
    );

    const missing = nodes
      .map((node) => glyph(node as Node & Drawn))
      .filter((name): name is string => Boolean(name))
      .filter((name) => !PACK.has(name));
    expect(missing).toEqual([]);
  });

  describe('containers', () => {
    it('numbers every container, pools included, so an explicit order is usable', () => {
      const { nodes } = build(
        'bpmn-beta LR\n  pool "P"\n    lane "A"\n      task t1 "T"\n    lane "B"\n      task t2 "T"'
      );
      const containers = nodes.filter((n) => n.isGroup);
      expect(containers.map((n) => n.metadata?.laneRole)).toEqual(['pool', 'lane', 'lane']);
      expect(containers.map((n) => n.metadata?.laneIndex)).toEqual([0, 1, 2]);
    });
  });

  describe('flows', () => {
    it('draws a message flow dashed, with an open head and a hollow source ring', () => {
      const { edges } = build(
        'bpmn-beta LR\n  lane "L"\n    task a "A"\n    task b "B"\n  a -.-> b'
      );
      expect(edges[0]).toMatchObject({
        pattern: 'dashed',
        arrowTypeStart: 'arrow_hollow_circle',
        arrowTypeEnd: 'arrow_open',
      });
    });

    it('draws a sequence flow solid, with a filled head and no source marker', () => {
      const { edges } = build(
        'bpmn-beta LR\n  lane "L"\n    task a "A"\n    task b "B"\n  a --> b'
      );
      expect(edges[0]).toMatchObject({
        pattern: 'solid',
        arrowTypeStart: 'none',
        arrowTypeEnd: 'arrow_point',
      });
    });
  });

  // BPMN 2.0.2 draws a caught trigger unfilled and a thrown one filled. The two that
  // throw are an end event and a throwing intermediate, which share nothing else, so
  // the db marks them rather than the shape inferring it from a ring weight.
  describe('catch and throw', () => {
    it.each([
      ['start message x "X"', false],
      ['intermediate message x "X"', false],
      ['boundary error x "X"', false],
      ['end message x "X"', true],
      ['throw compensation x "X"', true],
    ])('marks %s as throwing: %s', (statement, throws) => {
      const { nodes } = build(`bpmn-beta LR\n  lane "L"\n    ${statement}`);
      expect(nodeById(nodes, 'x').cssClasses?.includes('bpmn-throw')).toBe(throws);
    });

    it('gives a throwing intermediate the same double ring as a catching one', () => {
      const { nodes } = build(
        'bpmn-beta LR\n  lane "L"\n    intermediate message a "A"\n    throw message b "B"'
      );
      expect(nodeById(nodes, 'a').shape).toBe('bpmn-intermediate');
      expect(nodeById(nodes, 'b').shape).toBe('bpmn-intermediate');
    });
  });

  // A group is the last Level 1 artifact. It contains elements the way a lane does, but
  // it constrains no placement, so it must not be numbered or given a lane role - which
  // is what would happen if it were treated as a band.
  describe('groups', () => {
    const source =
      'bpmn-beta LR\n  lane "Sales"\n    group "Approval"\n      task t1 "Review"\n      task t2 "Sign off"';

    it('is a container, but not a band', () => {
      const { nodes } = build(source);
      const group = nodeById(nodes, 'group-2');
      expect(group.isGroup).toBe(true);
      expect(group.metadata?.laneRole).toBeUndefined();
      expect(group.metadata?.laneIndex).toBeUndefined();
    });

    it('does not consume a lane number', () => {
      const { nodes } = build(source);
      const lane = nodes.find((n) => n.metadata?.laneRole === 'lane')!;
      expect(lane.metadata?.laneIndex).toBe(0);
      expect(nodes.filter((n) => n.metadata?.laneIndex !== undefined)).toHaveLength(1);
    });

    it('holds its members', () => {
      const { nodes } = build(source);
      expect(nodeById(nodes, 't1').parentId).toBe('group-2');
      expect(nodeById(nodes, 't2').parentId).toBe('group-2');
    });
  });

  it('draws a call activity with its own class, since it is marked by a thick border', () => {
    const { nodes } = build('bpmn-beta LR\n  lane "L"\n    call c "Check credit"');
    const node = nodeById(nodes, 'c');
    expect(node.shape).toBe('bpmn-activity');
    expect(node.cssClasses).toContain('bpmn-call');
  });

  it('anchors a boundary event to the activity it interrupts', () => {
    const { nodes } = build(
      'bpmn-beta LR\n  lane "L"\n    user task t "T"\n      boundary timer b "2 days"'
    );
    expect(nodeById(nodes, 'b').metadata?.anchorTo).toEqual({ hostId: 't' });
  });

  describe('associations', () => {
    const source = `bpmn-beta LR
  lane l1 "L"
    task t1 "T"
    data-input d1 "D"
    note n1 "N"
  d1 ..> t1
  n1 ... t1
`;

    it('draws an association dotted, with an open head only when it points somewhere', () => {
      const { edges } = build(source);
      expect(edges.map((e) => [e.pattern, e.arrowTypeEnd, e.arrowTypeStart])).toEqual([
        ['dotted', 'arrow_open', 'none'],
        ['dotted', 'none', 'none'],
      ]);
    });

    // An association carries no order, so an artifact takes its place from what it
    // annotates. Anchoring is what keeps it out of the ranking that a flow would join.
    it('hangs an artifact off the element it is associated with', () => {
      const { nodes } = build(source);
      expect(nodeById(nodes, 'd1').metadata?.anchorTo).toMatchObject({ hostId: 't1' });
      expect(nodeById(nodes, 'n1').metadata?.anchorTo).toMatchObject({ hostId: 't1' });
      expect(nodeById(nodes, 't1').metadata?.anchorTo).toBeUndefined();
    });

    it('stands an artifact off its host, unlike a boundary event which sits on it', () => {
      const { nodes } = build(`bpmn-beta LR
  lane l1 "L"
    task t1 "T"
      boundary timer b1 "B"
    data d1 "D"
  d1 ..> t1
`);
      const artifact = nodeById(nodes, 'd1').metadata?.anchorTo as { gap?: number };
      const boundary = nodeById(nodes, 'b1').metadata?.anchorTo as { gap?: number };
      expect(artifact.gap).toBeGreaterThan(0);
      expect(boundary.gap).toBeUndefined();
    });

    it('carries the corner marker a data object was declared with', () => {
      const { nodes } = build(`bpmn-beta LR
  lane l1 "L"
    data plain "P"
    data-input in1 "I"
    data-output out1 "O"
    data-collection many "M"
`);
      expect(nodeById(nodes, 'plain').metadata).not.toHaveProperty('dataDirection');
      expect(nodeById(nodes, 'in1').metadata?.dataDirection).toBe('input');
      expect(nodeById(nodes, 'out1').metadata?.dataDirection).toBe('output');
      expect(nodeById(nodes, 'many').metadata?.isCollection).toBe(true);
    });
  });

  // Two flows out of a gateway happen at the same time. Laying them end to end would
  // read as one after the other, so the diagram asks for them side by side.
  it('asks for its branches to be laid out side by side', () => {
    const data = db.getData.call(
      (db.clear(), db.parse('bpmn-beta LR\n  lane "L"\n    task t "T"'), db)
    ) as unknown as { laneLayering?: string };
    expect(data.laneLayering).toBe('branches');
  });
});
