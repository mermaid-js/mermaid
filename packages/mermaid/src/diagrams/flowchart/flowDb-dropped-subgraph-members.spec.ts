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

  it('records nothing when a repeated subgraph id lists a node again', () => {
    expect(dropped('flowchart LR\nsubgraph S\n  x\nend\nsubgraph S\n  x\n  y\nend')).toEqual({});
  });

  it('forgets the records when the database is cleared', () => {
    const flowDb = parse('flowchart LR\nsubgraph one\n  a\nend\nsubgraph two\n  a\nend');

    flowDb.clear();

    expect(flowDb.getData().other).toEqual({});
  });
});
