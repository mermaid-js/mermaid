import { describe, it, expect } from 'vitest';
import { parseBpmn } from './bpmn.parser.js';

describe('bpmn parser', () => {
  it('reads the header and direction', () => {
    expect(parseBpmn('bpmn-beta LR\n').direction).toBe('LR');
  });

  it('nests by indentation', () => {
    const parsed = parseBpmn(`bpmn-beta LR
  pool p1 "Orders"
    lane l1 "Sales"
      start s1 "Received"
`);
    const byId = new Map(parsed.nodes.map((n) => [n.id, n]));
    expect(byId.get('p1')?.parentId).toBeUndefined();
    expect(byId.get('l1')?.parentId).toBe('p1');
    expect(byId.get('s1')?.parentId).toBe('l1');
  });

  // The whole document is trimmed before the parser sees it, so only relative depth
  // can be trusted - the same diagram indented further must nest identically.
  it('normalises against the first content line', () => {
    const shallow = parseBpmn('bpmn-beta LR\n  lane l1 "A"\n    task t1 "B"\n');
    const deep = parseBpmn('bpmn-beta LR\n      lane l1 "A"\n        task t1 "B"\n');
    expect(deep.nodes.map((n) => n.level)).toEqual(shallow.nodes.map((n) => n.level));
  });

  it('keeps element keywords and qualifiers apart', () => {
    const parsed = parseBpmn(`bpmn-beta LR
  start message s1 "In"
  user task t1 "Review"
  xor g1 "OK?"
  end error e1 "Failed"
`);
    expect(parsed.nodes.map((n) => [n.keyword, n.qualifier])).toEqual([
      ['start', 'message'],
      ['task', 'user'],
      ['xor', undefined],
      ['end', 'error'],
    ]);
  });

  it('reads plain, labelled and message flows, including chains', () => {
    const parsed = parseBpmn(`bpmn-beta LR
  start s1 "A"
  task t1 "B"
  end e1 "C"
  s1 --> t1 --> e1
  s1 -- yes --> e1
  t1 -.-> e1
`);
    expect(parsed.flows).toEqual([
      { from: 's1', to: 't1', kind: 'sequence', label: undefined },
      { from: 't1', to: 'e1', kind: 'sequence', label: undefined },
      { from: 's1', to: 'e1', kind: 'sequence', label: 'yes' },
      { from: 't1', to: 'e1', kind: 'message', label: undefined },
    ]);
  });

  it('generates an id when only a label is given', () => {
    const parsed = parseBpmn('bpmn-beta LR\n  task "Review order"\n');
    expect(parsed.nodes[0].id).toMatch(/^task-\d+$/);
    expect(parsed.nodes[0].label).toBe('Review order');
  });

  // The lexer, parser and visitor are module-level singletons, so a second diagram on
  // the same page must not inherit the first one's state.
  it('parses two diagrams in a row independently', () => {
    const first = parseBpmn('bpmn-beta LR\n  task t1 "One"\n');
    const second = parseBpmn('bpmn-beta TB\n  task t2 "Two"\n');
    expect(first.nodes).toHaveLength(1);
    expect(second.nodes).toHaveLength(1);
    expect(second.nodes[0].id).toBe('t2');
    expect(second.direction).toBe('TB');
  });

  it('ignores comments and blank lines', () => {
    expect(parseBpmn('bpmn-beta LR\n\n  %% a note\n  task t1 "One"\n\n').nodes).toHaveLength(1);
  });

  it('reports the line of a syntax error', () => {
    expect(() => parseBpmn('bpmn-beta LR\n  task t1 "One"\n  --> broken\n')).toThrow(/line 3/);
  });

  it('tells the two association connectors apart', () => {
    const parsed = parseBpmn(`bpmn-beta LR
  lane l1 "L"
    task t1 "T"
    data d1 "D"
    note n1 "N"
  d1 ..> t1
  n1 ... t1
`);
    expect(parsed.flows).toEqual([
      { from: 'd1', to: 't1', kind: 'association', directed: true, label: undefined },
      { from: 'n1', to: 't1', kind: 'association', directed: false, label: undefined },
    ]);
  });

  it('reads the marker a data object carries from its keyword', () => {
    const parsed = parseBpmn(`bpmn-beta LR
  lane l1 "L"
    data plain "P"
    data-input in1 "I"
    data-output out1 "O"
    data-collection many "M"
`);
    const byId = new Map(parsed.nodes.map((n) => [n.id, n]));
    expect(byId.get('plain')?.qualifier).toBeUndefined();
    expect(byId.get('in1')?.qualifier).toBe('input');
    expect(byId.get('out1')?.qualifier).toBe('output');
    expect(byId.get('many')?.qualifier).toBe('collection');
    // All four are data objects, so they draw the same outline.
    expect([...byId.values()].filter((n) => n.kind === 'data')).toHaveLength(4);
  });

  // `data-store` and `data-input` both begin with `data`, and an id may begin with a
  // keyword, so the lexer has to prefer the longest keyword and then give way.
  it('does not let a keyword swallow a longer word', () => {
    const parsed = parseBpmn('bpmn-beta LR\n  lane l1 "L"\n    data database "D"\n');
    expect(parsed.nodes.at(-1)).toMatchObject({ id: 'database', kind: 'data' });
  });

  it('reads a title and the text that describes the diagram', () => {
    const parsed = parseBpmn(`bpmn-beta LR
title Order handling
accTitle: How an order is handled
accDescr: An order is received, checked and filed.
  lane l1 "Sales"
    task t1 "Check"
`);
    expect(parsed.title).toBe('Order handling');
    expect(parsed.accTitle).toBe('How an order is handled');
    expect(parsed.accDescr).toBe('An order is received, checked and filed.');
    // The lines carrying them are not elements.
    expect(parsed.nodes.map((node) => node.id)).toEqual(['l1', 't1']);
  });

  it('reads a description written over several lines', () => {
    const parsed = parseBpmn(`bpmn-beta LR
accDescr {
  An order is received.
  It is then checked and filed.
}
  lane l1 "Sales"
`);
    expect(parsed.accDescr).toContain('An order is received.');
    expect(parsed.accDescr).toContain('It is then checked and filed.');
  });

  // `title` opens a statement only as a whole word, so an id may still begin with it.
  it('does not take a longer word for the title keyword', () => {
    const parsed = parseBpmn('bpmn-beta LR\n  lane l1 "L"\n    task titles "T"\n');
    expect(parsed.nodes.at(-1)?.id).toBe('titles');
    expect(parsed.title).toBeUndefined();
  });
});
