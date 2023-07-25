import flowDb from '../flowDb.js';
import flow from './flow.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing a flow chart with markdown strings', function () {
  beforeEach(function () {
    flow.parser.yy = flowDb;
    flow.parser.yy.clear();
  });

  it('mardown formatting in nodes and labels', function () {
    const res = flow.parser.parse(`flowchart
A["\`The cat in **the** hat\`"]-- "\`The *bat* in the chat\`" -->B["The dog in the hog"] -- "The rat in the mat" -->C;`);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert['A'].id).toBe('A');
    expect(vert['A'].text).toBe('The cat in **the** hat');
    expect(vert['A'].labelType).toBe('markdown');
    expect(vert['B'].id).toBe('B');
    expect(vert['B'].text).toBe('The dog in the hog');
    expect(vert['B'].labelType).toBe('string');
    expect(edges.length).toBe(2);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].type).toBe('arrow_point');
    expect(edges[0].text).toBe('The *bat* in the chat');
    expect(edges[0].labelType).toBe('markdown');
    expect(edges[1].start).toBe('B');
    expect(edges[1].end).toBe('C');
    expect(edges[1].type).toBe('arrow_point');
    expect(edges[1].text).toBe('The rat in the mat');
    expect(edges[1].labelType).toBe('text');
  });
  it('mardown formatting in subgraphs', function () {
    const res = flow.parser.parse(`flowchart LR
subgraph "One"
  a("\`The **cat**
  in the hat\`") -- "1o" --> b{{"\`The **dog** in the hog\`"}}
end
subgraph "\`**Two**\`"
  c("\`The **cat**
  in the hat\`") -- "\`1o **ipa**\`" --> d("The dog in the hog")
end`);

    const subgraphs = flow.parser.yy.getSubGraphs();
    expect(subgraphs.length).toBe(2);
    const subgraph = subgraphs[0];

    expect(subgraph.nodes.length).toBe(2);
    expect(subgraph.title).toBe('One');
    expect(subgraph.labelType).toBe('text');

    const subgraph2 = subgraphs[1];
    expect(subgraph2.nodes.length).toBe(2);
    expect(subgraph2.title).toBe('**Two**');
    expect(subgraph2.labelType).toBe('markdown');
  });
});
