import { describe, expect, it } from 'vitest';
import { FlowDB } from './flowDb.js';
import flow from './parser/flowParser.js';

const parse = (text: string) => {
  const flowDb = new FlowDB();
  flowDb.setGen('gen-2');
  flow.parser.yy = flowDb;
  flow.parser.parse(text);
  return flowDb;
};

const SWIMLANE_WITH_PHASES = [
  'swimlane-beta LR',
  'phase p1["Intake"]',
  'phase p2[Review]',
  'phase p3',
  'subgraph l1',
  '  a["receive request"]@{ phase: p1 }',
  '  b["assess"]@{ phase: p2 }',
  'end',
  'subgraph l2',
  '  c@{ phase: p3 }',
  'end',
  'a --> b --> c',
].join('\n');

describe('swimlane phases', () => {
  it('declares phases in source order, with the id as the label when none is given', () => {
    const { other } = parse(SWIMLANE_WITH_PHASES).getData();

    expect(other.phases).toEqual([
      { id: 'p1', label: 'Intake' },
      { id: 'p2', label: 'Review' },
      { id: 'p3', label: 'p3' },
    ]);
  });

  it('assigns each node to the phase named in its metadata', () => {
    const { other } = parse(SWIMLANE_WITH_PHASES).getData();

    expect(other.nodePhases).toEqual({ a: 'p1', b: 'p2', c: 'p3' });
  });

  it('assigns a phase from a later statement for a node that already exists', () => {
    const flowDb = parse(
      'swimlane-beta\nphase p1["One"]\nphase p2["Two"]\nsubgraph l1\n  a\nend\na@{ phase: p1 }\na@{ phase: p2 }'
    );

    expect(flowDb.getData().other.nodePhases).toEqual({ a: 'p2' });
  });

  it('adds nothing to the layout data when no phase is declared', () => {
    expect(parse('swimlane-beta\nsubgraph l1\n  a\nend').getData().other).toEqual({});
  });

  it('refuses a node that names a phase nobody declared', () => {
    expect(() =>
      parse('swimlane-beta\nphase p1["One"]\nsubgraph l1\n  a@{ phase: p9 }\nend')
    ).toThrow('Unknown phase "p9" on node "a". Declare it before the node with: phase p9["Title"]');
  });

  it('refuses a phase that is declared after the node that uses it', () => {
    expect(() =>
      parse('swimlane-beta\nsubgraph l1\n  a@{ phase: p1 }\nend\nphase p1["One"]')
    ).toThrow('Unknown phase "p1" on node "a"');
  });

  it('refuses a phase that is declared twice', () => {
    expect(() => parse('swimlane-beta\nphase p1["One"]\nphase p1["Again"]')).toThrow(
      'Phase "p1" is declared twice.'
    );
  });

  it('forgets phases when the database is cleared', () => {
    const flowDb = parse(SWIMLANE_WITH_PHASES);

    flowDb.clear();

    expect(flowDb.getData().other).toEqual({});
  });
});

describe('the phase keyword outside a declaration', () => {
  it.each(['swimlane-beta', 'flowchart', 'graph'])(
    'keeps phase, phase1 and phases as node ids in %s',
    (header) => {
      const vertices = parse(
        `${header} LR\nphase --> phase1\nphase1 --> phases\nphases --> phase`
      ).getVertices();

      expect([...vertices.keys()]).toEqual(['phase', 'phase1', 'phases']);
    }
  );

  it('does not turn a flowchart line starting with phase into a declaration', () => {
    expect(() => parse('flowchart LR\nphase p1["Intake"]')).toThrow();
  });

  it('ignores a phase key in the metadata of a flowchart node', () => {
    const flowDb = parse('flowchart LR\na@{ phase: p1 }');

    expect(flowDb.getData().other).toEqual({});
  });
});
