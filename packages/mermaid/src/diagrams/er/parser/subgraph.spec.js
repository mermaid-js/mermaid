import { setConfig } from '../../../config.js';
import { ErDB } from '../erDb.js';
import erDiagram from './erDiagram.jison';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing ER subgraphs', function () {
  beforeEach(function () {
    erDiagram.parser.yy = new ErDB();
    erDiagram.parser.yy.clear();
  });

  it('should handle subgraph with simple nodes and id/title', function () {
    erDiagram.parser.parse('erDiagram\nsubgraph Group\nA\nB\nend');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('A');
    expect(subgraph.nodes[1]).toBe('B');
    expect(subgraph.title).toBe('Group');
    expect(subgraph.id).toBe('Group');
  });

  it('should handle subgraph with multiple words in id/title', function () {
    erDiagram.parser.parse('erDiagram\nsubgraph "Some Title"\nA\nB\nend');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('Some Title');
    expect(subgraph.id).toBe('Some Title');
  });

  it('should handle subgraph with id and title notation', function () {
    erDiagram.parser.parse('erDiagram\nsubgraph id [Title]\nA\nB\nend');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.title).toBe('Title');
    expect(subgraph.id).toBe('id');
  });

  it('should handle special characters in subgraph title', function () {
    erDiagram.parser.parse('erDiagram\nsubgraph "Group 1.5"\nA\nend');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(1);
    expect(subgraph.title).toBe('Group 1.5');
    expect(subgraph.id).toBe('Group 1.5');
  });

  it('should handle empty lines inside subgraph', function () {
    erDiagram.parser.parse('erDiagram\nsubgraph Group\n\nA\n\nB\n\nend');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('A');
    expect(subgraph.nodes[1]).toBe('B');
    expect(subgraph.title).toBe('Group');
    expect(subgraph.id).toBe('Group');
  });

  it('should ignore redundant whitespace around end', function () {
    erDiagram.parser.parse('erDiagram\nsubgraph Group\nA\nend   \n');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(1);
    expect(subgraph.nodes[0]).toBe('A');
    expect(subgraph.title).toBe('Group');
    expect(subgraph.id).toBe('Group');
  });

  it('should handle empty subgraph', function () {
    erDiagram.parser.parse('erDiagram\nsubgraph empty\nend');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(0);
    expect(subgraph.title).toBe('empty');
    expect(subgraph.id).toBe('empty');
  });

  it('should correctly parse direction RL inside a subgraph', function () {
    erDiagram.parser.parse('erDiagram subgraph WithRL\ndirection RL\nA\nB\nend');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.dir).toBe('RL');
    expect(subgraph.nodes[0]).toBe('A');
    expect(subgraph.nodes[1]).toBe('B');
  });

  it('should include both endpoints of a relationship inside a subgraph', function () {
    erDiagram.parser.parse('erDiagram\nsubgraph Group\nA }|--|| B : "relates to"\nend');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    const relationships = erDiagram.parser.yy.getRelationships();
    const entities = erDiagram.parser.yy.getEntities();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.nodes[0]).toBe('A');
    expect(subgraph.nodes[1]).toBe('B');
    expect(relationships.length).toBe(1);
    expect(relationships[0].entityA).toBe(entities.get('A').id);
    expect(relationships[0].entityB).toBe(entities.get('B').id);
  });

  it('should handle relationship between subgraph entity and external entity', function () {
    erDiagram.parser.parse('erDiagram\nsubgraph Group\nA\nend\nA }|--|| B : "relates to"\n');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    const relationships = erDiagram.parser.yy.getRelationships();
    const entities = erDiagram.parser.yy.getEntities();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(1);
    expect(subgraph.nodes[0]).toBe('A');
    expect(subgraph.nodes).not.toContain('B');
    expect(relationships.length).toBe(1);
    expect(relationships[0].entityA).toBe(entities.get('A').id);
    expect(relationships[0].entityB).toBe(entities.get('B').id);
  });

  it('should handle relationship between subgraphs', function () {
    const str =
      'erDiagram\n' +
      'subgraph G1\n' +
      '  A\n' +
      'end\n' +
      'subgraph G2\n' +
      '  B\n' +
      'end\n' +
      'G1 }|--|| G2 : "relates to"\n';

    erDiagram.parser.parse(str);
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    const relationships = erDiagram.parser.yy.getRelationships();
    expect(subgraphs.length).toBe(2);
    expect(relationships.length).toBe(1);

    expect(relationships[0].entityA).toBe('G1');
    expect(relationships[0].entityB).toBe('G2');
  });

  it('should handle relationship between entities in different subgraphs', function () {
    const str =
      'erDiagram\n' +
      'subgraph G1\n' +
      '  A\n' +
      'end\n' +
      'subgraph G2\n' +
      '  B\n' +
      'end\n' +
      'A }|--|| B : "relates to"\n';

    erDiagram.parser.parse(str);
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    const relationships = erDiagram.parser.yy.getRelationships();
    const entities = erDiagram.parser.yy.getEntities();
    expect(subgraphs.length).toBe(2);
    expect(relationships.length).toBe(1);

    expect(subgraphs[0].nodes[0]).toBe('A');
    expect(subgraphs[1].nodes[0]).toBe('B');
    expect(relationships[0].entityA).toBe(entities.get('A').id);
    expect(relationships[0].entityB).toBe(entities.get('B').id);
  });

  it('should handle relationship between entity and subgraph', function () {
    erDiagram.parser.parse('erDiagram\nsubgraph Group\nA\nend\nGroup }|--|| B : "relates to"\n');
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    const relationships = erDiagram.parser.yy.getRelationships();
    const entities = erDiagram.parser.yy.getEntities();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(1);
    expect(subgraph.nodes).not.toContain('B');
    expect(relationships.length).toBe(1);
    expect(relationships[0].entityA).toBe('Group');
    expect(relationships[0].entityB).toBe(entities.get('B').id);
  });

  it('should handle multiple relationships inside a subgraph', function () {
    const str =
      'erDiagram\n' +
      'subgraph Group\n' +
      '  A }|--|| B : "r1"\n' +
      '  B }|--|| C : "r2"\n' +
      'end';
    erDiagram.parser.parse(str);
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    const relationships = erDiagram.parser.yy.getRelationships();
    const entities = erDiagram.parser.yy.getEntities();
    expect(subgraphs.length).toBe(1);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(3);
    expect(relationships.length).toBe(2);
    expect(relationships[0].entityA).toBe(entities.get('A').id);
    expect(relationships[0].entityB).toBe(entities.get('B').id);
    expect(relationships[1].entityA).toBe(entities.get('B').id);
    expect(relationships[1].entityB).toBe(entities.get('C').id);
  });
});

describe('when parsing ER nested subgraphs', function () {
  beforeEach(function () {
    erDiagram.parser.yy = new ErDB();
    erDiagram.parser.yy.clear();
  });

  it('should handle nested subgraphs correctly', function () {
    const str =
      'erDiagram\n' +
      'subgraph outer\n' +
      '  A\n' +
      '  subgraph inner\n' +
      '    B\n' +
      '  end\n' +
      'end';

    erDiagram.parser.parse(str);
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);
    const outer = subgraphs.find((sg) => sg.id === 'outer');
    const inner = subgraphs.find((sg) => sg.id === 'inner');

    expect(outer.nodes.length).toBe(2);
    expect(inner.nodes.length).toBe(1);
    expect(outer.nodes[0]).toBe('A');
    expect(inner.nodes[0]).toBe('B');
    expect(outer.title).toBe('outer');
    expect(inner.title).toBe('inner');
  });

  it('should handle nested subgraphs with irregular indentation', function () {
    const str =
      'erDiagram\n' +
      'subgraph outer\n' +
      '    A\n' +
      '      B\n' +
      '  subgraph inner\n' +
      '        C\n' +
      '  end\n' +
      'end';

    erDiagram.parser.parse(str);
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);
    const outer = subgraphs.find((sg) => sg.id === 'outer');
    const inner = subgraphs.find((sg) => sg.id === 'inner');

    expect(outer.nodes.length).toBe(3);
    expect(inner.nodes.length).toBe(1);
    expect(outer.nodes[0]).toBe('A');
    expect(outer.nodes[1]).toBe('B');
    expect(inner.nodes[0]).toBe('C');
    expect(outer.title).toBe('outer');
    expect(inner.title).toBe('inner');
  });

  it('should handle relationships inside nested subgraphs', function () {
    const str =
      'erDiagram\n' +
      'subgraph outer\n' +
      '  subgraph inner\n' +
      '    A }|--|| B : "relates to"\n' +
      '  end\n' +
      'end';

    erDiagram.parser.parse(str);
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    const relationships = erDiagram.parser.yy.getRelationships();
    const entities = erDiagram.parser.yy.getEntities();
    expect(subgraphs.length).toBe(2);

    const outer = subgraphs.find((sg) => sg.id === 'outer');
    const inner = subgraphs.find((sg) => sg.id === 'inner');

    expect(outer.nodes.length).toBe(1);
    expect(inner.nodes.length).toBe(2);
    expect(inner.nodes[0]).toBe('A');
    expect(inner.nodes[1]).toBe('B');
    expect(relationships.length).toBe(1);
    expect(relationships[0].entityA).toBe(entities.get('A').id);
    expect(relationships[0].entityB).toBe(entities.get('B').id);
  });

  it('should handle relationship between outer and inner subgraph entities', function () {
    const str =
      'erDiagram\n' +
      'subgraph outer\n' +
      '  A\n' +
      '  subgraph inner\n' +
      '    B\n' +
      '  end\n' +
      'end\n' +
      'A }|--|| B : "relates to"\n';

    erDiagram.parser.parse(str);
    const subgraphs = erDiagram.parser.yy.getSubGraphs();
    const relationships = erDiagram.parser.yy.getRelationships();
    const entities = erDiagram.parser.yy.getEntities();
    expect(subgraphs.length).toBe(2);

    const outer = subgraphs.find((sg) => sg.id === 'outer');
    const inner = subgraphs.find((sg) => sg.id === 'inner');

    expect(outer.nodes.length).toBe(2);
    expect(inner.nodes.length).toBe(1);
    expect(outer.nodes[0]).toBe('A');
    expect(inner.nodes[0]).toBe('B');
    expect(relationships.length).toBe(1);
    expect(relationships[0].entityA).toBe(entities.get('A').id);
    expect(relationships[0].entityB).toBe(entities.get('B').id);
  });
});
