import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

const stripped = [
  { name: 'arrow', arrow: '-->' },
  { name: 'open', arrow: '---' },
  { name: 'dotted', arrow: '-.->' },
  { name: 'thick', arrow: '==>' },
  { name: 'cross', arrow: '--x' },
  { name: 'circle', arrow: '--o' },
  { name: 'bidirectional', arrow: '<-->' },
  { name: 'long', arrow: '---->' },
  { name: 'invisible', arrow: '~~~' },
];

describe('[Flowchart] a class on an edge: A -->:::name B', function () {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
  });

  stripped.forEach(({ name, arrow }) => {
    it(`adds the class to a ${name} edge (${arrow})`, function () {
      flow.parser.parse(`flowchart TD;\nA ${arrow}:::hot B;`);
      const edges = flow.parser.yy.getEdges();
      expect(edges).toHaveLength(1);
      expect(edges[0].start).toBe('A');
      expect(edges[0].end).toBe('B');
      expect(edges[0].classes).toEqual(['hot']);
    });
  });

  it('keeps the edge type, stroke and an empty label', function () {
    flow.parser.parse('flowchart TD;\nA ==>:::hot B;');
    const [edge] = flow.parser.yy.getEdges();
    expect(edge.type).toBe('arrow_point');
    expect(edge.stroke).toBe('thick');
    expect(edge.text).toBe('');
  });

  it('accepts no space before the class and no space after the arrow', function () {
    flow.parser.parse('flowchart TD;\nA-->:::hot B;');
    expect(flow.parser.yy.getEdges()[0].classes).toEqual(['hot']);
  });

  it('accepts a pipe label before the class', function () {
    flow.parser.parse('flowchart TD;\nA -->|yes|:::hot B;');
    const [edge] = flow.parser.yy.getEdges();
    expect(edge.text).toBe('yes');
    expect(edge.classes).toEqual(['hot']);
  });

  it('accepts an inline text label before the class', function () {
    flow.parser.parse('flowchart TD;\nA -- yes -->:::hot B;');
    const [edge] = flow.parser.yy.getEdges();
    expect(edge.text).toBe('yes');
    expect(edge.classes).toEqual(['hot']);
  });

  it('combines with an edge id', function () {
    flow.parser.parse('flowchart TD;\nA e1@-->:::hot B;');
    const [edge] = flow.parser.yy.getEdges();
    expect(edge.id).toBe('e1');
    expect(edge.classes).toEqual(['hot']);
  });

  it('gives every edge of a group the class', function () {
    flow.parser.parse('flowchart TD;\nA & B -->:::hot C & D;');
    const edges = flow.parser.yy.getEdges();
    expect(edges).toHaveLength(4);
    edges.forEach((edge) => expect(edge.classes).toEqual(['hot']));
  });

  it('does not share one class array between the edges of a group', function () {
    flow.parser.parse('flowchart TD;\nA -->:::hot B & C;\nclass L_A_B_0 extra;');
    const edges = flow.parser.yy.getEdges();
    expect(edges[0].classes).toEqual(['hot', 'extra']);
    expect(edges[1].classes).toEqual(['hot']);
  });

  it('classes only the link it is written on in a chain', function () {
    flow.parser.parse('flowchart TD;\nA -->:::hot B --> C;');
    const edges = flow.parser.yy.getEdges();
    expect(edges.map((e) => e.classes)).toEqual([['hot'], []]);
  });

  it('classes each link of a chain separately', function () {
    flow.parser.parse('flowchart TD;\nA -->:::one B -.->:::two C;');
    const edges = flow.parser.yy.getEdges();
    expect(edges.map((e) => e.classes)).toEqual([['one'], ['two']]);
  });

  it('works next to a node class', function () {
    flow.parser.parse('flowchart TD;\nA:::n1 -->:::hot B:::n2;');
    const edges = flow.parser.yy.getEdges();
    const vertices = flow.parser.yy.getVertices();
    expect(edges[0].classes).toEqual(['hot']);
    expect(vertices.get('A').classes).toEqual(['n1']);
    expect(vertices.get('B').classes).toEqual(['n2']);
  });

  it('adds to the classes a class statement gives the same edge', function () {
    flow.parser.parse('flowchart TD;\nA e1@-->:::hot B;\nclass e1 extra;');
    expect(flow.parser.yy.getEdges()[0].classes).toEqual(['hot', 'extra']);
  });

  it('gives an edge without the suffix no classes', function () {
    flow.parser.parse('flowchart TD;\nA --> B;');
    expect(flow.parser.yy.getEdges()[0].classes).toEqual([]);
  });

  it('keeps `A --:::hot--> B` as an edge labelled ":::hot"', function () {
    flow.parser.parse('flowchart TD;\nA --:::hot--> B;');
    const [edge] = flow.parser.yy.getEdges();
    expect(edge.text).toBe(':::hot');
    expect(edge.classes).toEqual([]);
  });

  it('keeps `A --:::hot B` as a parse error, not a class', function () {
    expect(() => flow.parser.parse('flowchart TD;\nA --:::hot B;')).toThrow();
  });
});
