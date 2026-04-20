import { FlowDB } from '../flowDb.js';
import flow from './flowParser.ts';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing a flow chart with markdown strings', function () {
  beforeEach(function () {
    flow.parser.yy = new FlowDB();
    flow.parser.yy.clear();
  });

  it('markdown formatting in nodes and labels', function () {
    const res = flow.parser.parse(`flowchart
A["\`The cat in **the** hat\`"]-- "\`The *bat* in the chat\`" -->B["The dog in the hog"] -- "The rat in the mat" -->C;`);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('A').text).toBe('The cat in **the** hat');
    expect(vert.get('A').labelType).toBe('markdown');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('B').text).toBe('The dog in the hog');
    expect(vert.get('B').labelType).toBe('string');
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
    expect(edges[1].labelType).toBe('string');
  });
  it('markdown formatting in subgraphs', function () {
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

  it('markdown links in nodes and labels', function () {
    const res = flow.parser.parse(`flowchart LR
A["\`[Google](https://google.com)\`"]-- "\`Click [here](https://example.com)\`" -->B["\`[GitHub](https://github.com)\`"]`);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('A').text).toBe('[Google](https://google.com)');
    expect(vert.get('A').labelType).toBe('markdown');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('B').text).toBe('[GitHub](https://github.com)');
    expect(vert.get('B').labelType).toBe('markdown');
    expect(edges.length).toBe(1);
    expect(edges[0].start).toBe('A');
    expect(edges[0].end).toBe('B');
    expect(edges[0].text).toBe('Click [here](https://example.com)');
    expect(edges[0].labelType).toBe('markdown');
  });

  it('markdown links with surrounding text', function () {
    const res = flow.parser.parse(`flowchart LR
A["\`Go to [Google](https://google.com) for search\`"] --> B["\`Visit [GitHub](https://github.com) for code\`"]`);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('A').text).toBe('Go to [Google](https://google.com) for search');
    expect(vert.get('A').labelType).toBe('markdown');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('B').text).toBe('Visit [GitHub](https://github.com) for code');
    expect(vert.get('B').labelType).toBe('markdown');
  });

  it('multiple markdown links in one label', function () {
    const res = flow.parser.parse(`flowchart LR
A["\`Go to [Google](https://google.com) or [GitHub](https://github.com)\`"] --> B["\`Choose [Option A](https://example.com/a) or [Option B](https://example.com/b)\`"]`);

    const vert = flow.parser.yy.getVertices();
    const edges = flow.parser.yy.getEdges();

    expect(vert.get('A').id).toBe('A');
    expect(vert.get('A').text).toBe(
      'Go to [Google](https://google.com) or [GitHub](https://github.com)'
    );
    expect(vert.get('A').labelType).toBe('markdown');
    expect(vert.get('B').id).toBe('B');
    expect(vert.get('B').text).toBe(
      'Choose [Option A](https://example.com/a) or [Option B](https://example.com/b)'
    );
    expect(vert.get('B').labelType).toBe('markdown');
  });
});
