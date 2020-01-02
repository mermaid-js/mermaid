import flowDb from '../flowDb';
import flow from './flow';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict'
});

describe('when parsing flowcharts', function() {
  beforeEach(function() {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('should handle chaining of vertices', function() {
    const res = flow.parser.parse(`
    graph TD
      A-->B-->C;
    `);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(vert['C'].id).toBe('C');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
    expect(edges[1].type).toBe('arrow');
    expect(edges[1].text).toBe('');
  });
  it('should handle chaining of vertices', function() {
    const res = flow.parser.parse(`
    graph TD
      A & B --> C;
    `);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(vert['C'].id).toBe('C');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('C');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
    expect(edges[1].type).toBe('arrow');
    expect(edges[1].text).toBe('');
  });
  it('should multiple vertices in link statement in the begining', function() {
    const res = flow.parser.parse(`
    graph TD
      A-->B & C;
    `);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(vert['C'].id).toBe('C');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
    expect(edges[1].start).toBe('A');
    expect(edges[1].end).toBe('C');
    expect(edges[1].type).toBe('arrow');
    expect(edges[1].text).toBe('');
  });
  it('should multiple vertices in link statement at the end', function() {
    const res = flow.parser.parse(`
    graph TD
      A & B--> C & D;
    `);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(vert['C'].id).toBe('C');
    expect(vert['D'].id).toBe('D');
    expect(edges.length).toBe(4);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('C');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
    expect(edges[1].start).toBe('A');
    expect(edges[1].end).toBe('D');
    expect(edges[1].type).toBe('arrow');
    expect(edges[1].text).toBe('');
    expect(edges[2].start).toBe('B');
    expect(edges[2].end).toBe('C');
    expect(edges[2].type).toBe('arrow');
    expect(edges[2].text).toBe('');
    expect(edges[3].start).toBe('B');
    expect(edges[3].end).toBe('D');
    expect(edges[3].type).toBe('arrow');
    expect(edges[3].text).toBe('');
  });
  it('should handle chaining of vertices at both ends at once', function() {
    const res = flow.parser.parse(`
    graph TD
      A & B--> C & D;
    `);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(vert['C'].id).toBe('C');
    expect(vert['D'].id).toBe('D');
    expect(edges.length).toBe(4);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('C');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
    expect(edges[1].start).toBe('A');
    expect(edges[1].end).toBe('D');
    expect(edges[1].type).toBe('arrow');
    expect(edges[1].text).toBe('');
    expect(edges[2].start).toBe('B');
    expect(edges[2].end).toBe('C');
    expect(edges[2].type).toBe('arrow');
    expect(edges[2].text).toBe('');
    expect(edges[3].start).toBe('B');
    expect(edges[3].end).toBe('D');
    expect(edges[3].type).toBe('arrow');
    expect(edges[3].text).toBe('');
  });
  it('should handle chaining and multiple nodes in in link statement FVC ', function() {
    const res = flow.parser.parse(`
    graph TD
      A --> B & B2 & C --> D2;
    `);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(vert['B2'].id).toBe('B2');
    expect(vert['C'].id).toBe('C');
    expect(vert['D2'].id).toBe('D2');
    expect(edges.length).toBe(6);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('');
    expect(edges[1].start).toBe('A');
    expect(edges[1].end).toBe('B2');
    expect(edges[1].type).toBe('arrow');
    expect(edges[1].text).toBe('');
    expect(edges[2].start).toBe('A');
    expect(edges[2].end).toBe('C');
    expect(edges[2].type).toBe('arrow');
    expect(edges[2].text).toBe('');
    expect(edges[3].start).toBe('B');
    expect(edges[3].end).toBe('D2');
    expect(edges[3].type).toBe('arrow');
    expect(edges[3].text).toBe('');
    expect(edges[4].start).toBe('B2');
    expect(edges[4].end).toBe('D2');
    expect(edges[4].type).toBe('arrow');
    expect(edges[4].text).toBe('');
    expect(edges[5].start).toBe('C');
    expect(edges[5].end).toBe('D2');
    expect(edges[5].type).toBe('arrow');
    expect(edges[5].text).toBe('');
  });
  it('should handle chaining and multiple nodes in in link statement with extra info in statements', function() {
    const res = flow.parser.parse(`
    graph TD
      A[ h ] -- hello --> B[" test "]:::exClass & C --> D;
      classDef exClass background:#bbb,border:1px solid red;
    `);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    const classes = flow.parser.yy.getClasses();

    expect(classes['exClass'].styles.length).toBe(2);
    expect(classes['exClass'].styles[0]).toBe('background:#bbb');
    expect(classes['exClass'].styles[1]).toBe('border:1px solid red');
    expect(vert['A'].id).toBe('A');
    expect(vert['B'].id).toBe('B');
    expect(vert['B'].classes[0]).toBe('exClass');
    expect(vert['C'].id).toBe('C');
    expect(vert['D'].id).toBe('D');
    expect(edges.length).toBe(4);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow');
    expect(edges[0].text).toBe('hello');
    expect(edges[1].start).toBe('A');
    expect(edges[1].end).toBe('C');
    expect(edges[1].type).toBe('arrow');
    expect(edges[1].text).toBe('hello');
    expect(edges[2].start).toBe('B');
    expect(edges[2].end).toBe('D');
    expect(edges[2].type).toBe('arrow');
    expect(edges[2].text).toBe('');
    expect(edges[3].start).toBe('C');
    expect(edges[3].end).toBe('D');
    expect(edges[3].type).toBe('arrow');
    expect(edges[3].text).toBe('');
  });
});
