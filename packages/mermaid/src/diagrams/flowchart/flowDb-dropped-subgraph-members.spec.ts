import { describe, expect, it } from 'vitest';
import { prepareLayoutForSwimlanes } from '../../rendering-util/layout-algorithms/swimlanes/helpers.js';
import { FlowDB } from './flowDb.js';
import flow from './parser/flowParser.js';

const parse = (text: string) => {
  const flowDb = new FlowDB();
  flowDb.setGen('gen-2');
  flow.parser.yy = flowDb;
  flow.parser.parse(text);
  return flowDb;
};

const dropped = (text: string) => parse(text).getData().other;

describe('members a subgraph loses to an earlier subgraph', () => {
  it('records a node listed in two unrelated subgraphs', () => {
    expect(dropped('flowchart LR\nsubgraph lane1\n  a\nend\nsubgraph phase1\n  a\nend')).toEqual({
      droppedSubGraphMembers: [{ node: 'a', keptBy: 'lane1', droppedFrom: 'phase1' }],
    });
  });

  it('records every shared node of a subgraph, in source order', () => {
    const other = dropped(
      'flowchart LR\nsubgraph one\n  a\n  b\nend\nsubgraph two\n  b\n  a\n  c\nend'
    );

    expect(other.droppedSubGraphMembers).toEqual([
      { node: 'b', keptBy: 'one', droppedFrom: 'two' },
      { node: 'a', keptBy: 'one', droppedFrom: 'two' },
    ]);
  });

  it('records nothing for subgraphs that share no node', () => {
    expect(dropped('flowchart LR\nsubgraph one\n  a\nend\nsubgraph two\n  b\nend')).toEqual({});
  });

  it('records nothing for a subgraph nested in another that lists the same node', () => {
    expect(dropped('flowchart LR\nsubgraph outer\n  subgraph inner\n    a\n  end\nend')).toEqual(
      {}
    );
  });

  it('records nothing when the keeping subgraph is nested deeper in the dropping one', () => {
    expect(
      dropped(
        'flowchart LR\nsubgraph L1\n  subgraph M\n    subgraph I\n      a\n    end\n  end\n  a\nend'
      )
    ).toEqual({});
  });

  it('records nothing when a repeated subgraph id lists a node again', () => {
    expect(dropped('flowchart LR\nsubgraph S\n  x\nend\nsubgraph S\n  x\n  y\nend')).toEqual({});
  });

  it('forgets the records when the database is cleared', () => {
    const flowDb = parse('flowchart LR\nsubgraph one\n  a\nend\nsubgraph two\n  a\nend');

    flowDb.clear();

    expect(flowDb.getData().other).toEqual({});
  });

  it('forgets an owner removed while breaking a subgraph cycle', () => {
    expect(
      dropped(
        'flowchart LR\nsubgraph kept\n  target\nend\nsubgraph dropped\n  target\nend\nsubgraph target\n  kept\nend'
      )
    ).toEqual({});
  });

  it('preserves unrelated dropped members when breaking a subgraph cycle', () => {
    expect(
      dropped(
        'flowchart LR\nsubgraph kept\n  target\n  a\nend\nsubgraph dropped\n  target\n  a\nend\nsubgraph target\n  kept\nend'
      )
    ).toEqual({
      droppedSubGraphMembers: [{ node: 'a', keptBy: 'kept', droppedFrom: 'dropped' }],
    });
  });

  it('keeps an empty swimlane after its former owner loses a cyclic member', () => {
    const layout = parse(
      'flowchart LR\nsubgraph kept\n  target\nend\nsubgraph dropped\n  target\nend\nsubgraph target\n  kept\nend'
    ).getData();

    prepareLayoutForSwimlanes(layout);

    expect(layout.nodes.find((node) => node.id === 'dropped')).toMatchObject({
      shape: 'swimlane',
    });
  });
});
