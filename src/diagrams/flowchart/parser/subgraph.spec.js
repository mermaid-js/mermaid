import flowDb from '../flowDb'
import flow from './flow'
import { setConfig } from '../../../config'

setConfig({
  securityLevel: 'strict',
})

describe('when parsing subgraphs', function () {
  beforeEach(function () {
    flow.parser.yy = flowDb
    flow.parser.yy.clear()
  })
  it('should handle subgraph with tab indentation', function () {
    const res = flow.parser.parse('graph TB\nsubgraph One\n\ta1-->a2\nend')
    const subgraphs = flow.parser.yy.getSubGraphs()
    expect(subgraphs.length).toBe(1)
    const subgraph = subgraphs[0]
    expect(subgraph.nodes.length).toBe(2)
    expect(subgraph.nodes[0]).toBe('a1')
    expect(subgraph.nodes[1]).toBe('a2')
    expect(subgraph.title).toBe('One')
    expect(subgraph.id).toBe('One')
  })

  it('should handle subgraph with multiple words in title', function () {
    const res = flow.parser.parse('graph TB\nsubgraph "Some Title"\n\ta1-->a2\nend')
    const subgraphs = flow.parser.yy.getSubGraphs()
    expect(subgraphs.length).toBe(1)
    const subgraph = subgraphs[0]
    expect(subgraph.nodes.length).toBe(2)
    expect(subgraph.nodes[0]).toBe('a1')
    expect(subgraph.nodes[1]).toBe('a2')
    expect(subgraph.title).toBe('Some Title')
    expect(subgraph.id).toBe('subGraph0')
  });

  it('should handle subgraph with id and title notation', function () {
    const res = flow.parser.parse('graph TB\nsubgraph some-id[Some Title]\n\ta1-->a2\nend')
    const subgraphs = flow.parser.yy.getSubGraphs()
    expect(subgraphs.length).toBe(1)
    const subgraph = subgraphs[0]
    expect(subgraph.nodes.length).toBe(2)
    expect(subgraph.nodes[0]).toBe('a1')
    expect(subgraph.nodes[1]).toBe('a2')
    expect(subgraph.title).toBe('Some Title')
    expect(subgraph.id).toBe('some-id')
  });

  xit('should handle subgraph without id and space in title', function () {
    const res = flow.parser.parse('graph TB\nsubgraph Some Title\n\ta1-->a2\nend')
    const subgraphs = flow.parser.yy.getSubGraphs()
    expect(subgraphs.length).toBe(1)
    const subgraph = subgraphs[0]
    expect(subgraph.nodes.length).toBe(2)
    expect(subgraph.nodes[0]).toBe('a1')
    expect(subgraph.nodes[1]).toBe('a2')
    expect(subgraph.title).toBe('Some Title')
    expect(subgraph.id).toBe('some-id')
  });

  it('should handle subgraph id starting with a number', function () {
    const res = flow.parser.parse(`graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    subgraph 1test
    A
    end`)

    const subgraphs = flow.parser.yy.getSubGraphs()
    expect(subgraphs.length).toBe(1)
    const subgraph = subgraphs[0]
    expect(subgraph.nodes.length).toBe(1)
    expect(subgraph.nodes[0]).toBe('A')
    expect(subgraph.id).toBe('1test')
  });

  it('should handle subgraphs1', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph myTitle;c-->d;end;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

  it('should handle subgraphs2', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\n\n c-->d \nend\n')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

  it('should handle nested subgraphs', function () {
    const str = 'graph TD\n' +
            'A-->B\n' +
            'subgraph myTitle\n\n' +
            ' c-->d \n\n' +
            ' subgraph inner\n\n   e-->f \n end \n\n' +
            ' subgraph inner\n\n   h-->i \n end \n\n' +
            'end\n'
    const res = flow.parser.parse(str)
  })

  it('should handle subgraphs4', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\nc-->d\nend;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

  it('should handle subgraphs5', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\nc-- text -->d\nd-->e\n end;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

})
