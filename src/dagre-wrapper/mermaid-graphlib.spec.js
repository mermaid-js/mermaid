import graphlib from 'graphlib';
import dagre from 'dagre';
import { validate, adjustClustersAndEdges, extractDecendants } from './mermaid-graphlib';
import { setLogLevel, logger } from '../logger';

describe('Graphlib decorations', () => {
  let g;
  beforeEach(function () {
    setLogLevel(1);
    g = new graphlib.Graph({
      multigraph: true,
      compound: true
    });
    g.setGraph({
      rankdir: 'TB',
      nodesep: 10,
      ranksep: 10,
      marginx: 8,
      marginy: 8
    });
    g.setDefaultEdgeLabel(function () {
        return {};
    });
  });

  describe('validate', function () {
    it('Validate should detect edges between clusters', function () {
      /*
        subgraph C1
          a --> b
        end
        subgraph C2
          c
        end
        C1 --> C2
      */
      g.setNode('a', { data:1});
      g.setNode('b', { data: 2 });
      g.setNode('c', { data: 3 });
      g.setParent('a', 'C1');
      g.setParent('b', 'C1');
      g.setParent('c', 'C2');
      g.setEdge('a', 'b');
      g.setEdge('C1', 'C2');

      console.log(g.nodes())

      expect(validate(g)).toBe(false);
    });
    it('Validate should not detect edges between clusters after adjustment', function () {
      /*
        subgraph C1
          a --> b
        end
        subgraph C2
          c
        end
        C1 --> C2
      */
      g.setNode('a', {});
      g.setNode('b', {});
      g.setNode('c', {});
      g.setParent('a', 'C1');
      g.setParent('b', 'C1');
      g.setParent('c', 'C2');
      g.setEdge('a', 'b');
      g.setEdge('C1', 'C2');

      console.log(g.nodes())
      adjustClustersAndEdges(g);
      logger.info(g.edges())
      expect(validate(g)).toBe(true);
    });

    it('Validate should detect edges between clusters and transform clusters GLB4', function () {
      /*
        a --> b
        subgraph C1
          subgraph C2
            a
          end
          b
        end
        C1 --> c
      */
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setNode('c', { data: 3 });
      g.setNode('C1', { data: 4 });
      g.setNode('C2', { data: 5 });
      g.setParent('a', 'C2');
      g.setParent('b', 'C1');
      g.setParent('C2', 'C1');
      g.setEdge('a', 'b', { name: 'C1-internal-link' });
      g.setEdge('C1', 'c', { name: 'C1-external-link' });

      adjustClustersAndEdges(g);
      logger.info(g.nodes())
      expect(g.nodes().length).toBe(2);
      expect(validate(g)).toBe(true);
    });
    it('Validate should detect edges between clusters and transform clusters GLB5', function () {
      /*
        a --> b
        subgraph C1
          a
        end
        subgraph C2
          b
        end
        C1 -->
      */
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setParent('a', 'C1');
      g.setParent('b', 'C2');
      // g.setEdge('a', 'b', { name: 'C1-internal-link' });
      g.setEdge('C1', 'C2', { name: 'C1-external-link' });

      logger.info(g.nodes())
      adjustClustersAndEdges(g);
      logger.info(g.nodes())
      expect(g.nodes().length).toBe(2);
      expect(validate(g)).toBe(true);
    });
  it('adjustClustersAndEdges GLB6', function () {
    /*
      subgraph C1
        a
      end
      C1 --> b
    */
    g.setNode('a', { data: 1 });
    g.setNode('b', { data: 2 });
    g.setNode('C1', { data: 3 });
    g.setParent('a', 'C1');
    g.setEdge('C1', 'b', { data: 'link1' }, '1');

    // logger.info(g.edges())
    adjustClustersAndEdges(g);
    logger.info(g.edges())
    expect(g.nodes()).toEqual(['b', 'C1']);
    expect(g.edges().length).toBe(1);
    expect(validate(g)).toBe(true);
    expect(g.node('C1').clusterNode).toBe(true);

    const C1Graph = g.node('C1').graph;
    expect(C1Graph.nodes()).toEqual(['a']);
  });
  it('adjustClustersAndEdges GLB7', function () {
    /*
      subgraph C1
        a
      end
      C1 --> b
      C1 --> c
    */
    g.setNode('a', { data: 1 });
    g.setNode('b', { data: 2 });
    g.setNode('c', { data: 3 });
    g.setParent('a', 'C1');
    g.setNode('C1', { data: 4 });
    g.setEdge('C1', 'b', { data: 'link1' }, '1');
    g.setEdge('C1', 'c', { data: 'link2' }, '2');

    logger.info(g.node('C1'))
    adjustClustersAndEdges(g);
    logger.info(g.edges())
    expect(g.nodes()).toEqual(['b', 'c', 'C1']);
    expect(g.nodes().length).toBe(3);
    expect(g.edges().length).toBe(2);

    expect(g.edges().length).toBe(2);
    const edgeData = g.edge(g.edges()[1]);
    expect(edgeData.data).toBe('link2');
    expect(validate(g)).toBe(true);

    const C1Graph = g.node('C1').graph;
    expect(C1Graph.nodes()).toEqual(['a']);
  });
  it('adjustClustersAndEdges GLB8', function () {
    /*
    subgraph A
      a
    end
    subgraph B
      b
    end
    subgraph C
      c
    end
    A --> B
    A --> C
    */
    g.setNode('a', { data: 1 });
    g.setNode('b', { data: 2 });
    g.setNode('c', { data: 3 });
    g.setParent('a', 'A');
    g.setParent('b', 'B');
    g.setParent('c', 'C');
    g.setEdge('A', 'B', { data: 'link1' }, '1');
    g.setEdge('A', 'C', { data: 'link2' }, '2');

    // logger.info(g.edges())
    adjustClustersAndEdges(g);
    expect(g.nodes()).toEqual(['A', 'B', 'C']);
    expect(g.edges().length).toBe(2);

    expect(g.edges().length).toBe(2);
    const edgeData = g.edge(g.edges()[1]);
    expect(edgeData.data).toBe('link2');
    expect(validate(g)).toBe(true);

    const CGraph = g.node('C').graph;
    expect(CGraph.nodes()).toEqual(['c']);

  });

  it('adjustClustersAndEdges the extracted graphs shall contain the correct data GLB10', function () {
    /*
    subgraph C
      subgraph D
        d
      end
    end
    */

    g.setNode('C', { data: 1 });
    g.setNode('D', { data: 2 });
    g.setNode('d', { data: 3 });
    g.setParent('d', 'D');
    g.setParent('D', 'C');

    // logger.info('Graph before', g.node('D'))
    // logger.info('Graph before', graphlib.json.write(g))
    adjustClustersAndEdges(g);
    // logger.info('Graph after', graphlib.json.write(g), g.node('C').graph)

    const CGraph = g.node('C').graph;
    const DGraph = CGraph.node('D').graph;

    expect(CGraph.nodes()).toEqual(['D']);
    expect(DGraph.nodes()).toEqual(['d']);

    expect(g.nodes()).toEqual(['C']);
    expect(g.nodes().length).toBe(1);
  });

  it('adjustClustersAndEdges the extracted graphs shall contain the correct data GLB11', function () {
    /*
    subgraph A
      a
    end
    subgraph B
      b
    end
    subgraph C
      subgraph D
        d
      end
    end
    A --> B
    A --> C
    */

    g.setNode('C', { data: 1 });
    g.setNode('D', { data: 2 });
    g.setNode('d', { data: 3 });
    g.setNode('B', { data: 4 });
    g.setNode('b', { data: 5 });
    g.setNode('A', { data: 6 });
    g.setNode('a', { data: 7 });
    g.setParent('a', 'A');
    g.setParent('b', 'B');
    g.setParent('d', 'D');
    g.setParent('D', 'C');
    g.setEdge('A', 'B', { data: 'link1' }, '1');
    g.setEdge('A', 'C', { data: 'link2' }, '2');

    logger.info('Graph before', g.node('D'))
    logger.info('Graph before', graphlib.json.write(g))
    adjustClustersAndEdges(g);
    logger.trace('Graph after', graphlib.json.write(g))
    expect(g.nodes()).toEqual(['C', 'B', 'A']);
    expect(g.nodes().length).toBe(3);
    expect(g.edges().length).toBe(2);

    const AGraph = g.node('A').graph;
    const BGraph = g.node('B').graph;
    const CGraph = g.node('C').graph;
    // logger.info(CGraph.nodes());
    const DGraph = CGraph.node('D').graph;
    // logger.info('DG', CGraph.children('D'));

    logger.info('A', AGraph.nodes());
    expect(AGraph.nodes().length).toBe(1);
    expect(AGraph.nodes()).toEqual(['a']);
    logger.trace('Nodes', BGraph.nodes())
    expect(BGraph.nodes().length).toBe(1);
    expect(BGraph.nodes()).toEqual(['b']);
    expect(CGraph.nodes()).toEqual(['D']);
    expect(CGraph.nodes().length).toEqual(1);

    expect(AGraph.edges().length).toBe(0);
    expect(BGraph.edges().length).toBe(0);
    expect(CGraph.edges().length).toBe(0);
    expect(DGraph.nodes()).toEqual(['d']);
    expect(DGraph.edges().length).toBe(0);
    // expect(CGraph.node('D')).toEqual({ data: 2 });
    expect(g.edges().length).toBe(2);

    // expect(g.edges().length).toBe(2);
    // const edgeData = g.edge(g.edges()[1]);
    // expect(edgeData.data).toBe('link2');
    // expect(validate(g)).toBe(true);
  });
  it('adjustClustersAndEdges the extracted graphs shall contain the correct links  GLB20', function () {
    /*
      a --> b
      subgraph b [Test]
        c --> d -->e
      end
    */
    g.setNode('a', { data: 1 });
    g.setNode('b', { data: 2 });
    g.setNode('c', { data: 3 });
    g.setNode('d', { data: 3 });
    g.setNode('e', { data: 3 });
    g.setParent('c', 'b');
    g.setParent('d', 'b');
    g.setParent('e', 'b');
    g.setEdge('a', 'b', { data: 'link1' }, '1');
    g.setEdge('c', 'd', { data: 'link2' }, '2');
    g.setEdge('d', 'e', { data: 'link2' }, '2');

    logger.info('Graph before', graphlib.json.write(g))
    adjustClustersAndEdges(g);
    const bGraph = g.node('b').graph;
    // logger.trace('Graph after', graphlib.json.write(g))
    logger.info('Graph after', graphlib.json.write(bGraph));
    expect(bGraph.nodes().length).toBe(3);
    expect(bGraph.edges().length).toBe(2);
  });
  it('adjustClustersAndEdges the extracted graphs shall contain the correct links  GLB21', function () {
    /*
    state a {
        state b {
            state c {
                e
            }
        }
    }
    */
    g.setNode('a', { data: 1 });
    g.setNode('b', { data: 2 });
    g.setNode('c', { data: 3 });
    g.setNode('e', { data: 3 });
    g.setParent('b', 'a');
    g.setParent('c', 'b');
    g.setParent('e', 'c');

    logger.info('Graph before', graphlib.json.write(g))
    adjustClustersAndEdges(g);
    const aGraph = g.node('a').graph;
    const bGraph = aGraph.node('b').graph;
    logger.info('Graph after', graphlib.json.write(aGraph));
    const cGraph = bGraph.node('c').graph;
    // logger.trace('Graph after', graphlib.json.write(g))
    expect(aGraph.nodes().length).toBe(1);
    expect(bGraph.nodes().length).toBe(1);
    expect(cGraph.nodes().length).toBe(1);
    expect(bGraph.edges().length).toBe(0);
  });

});
});
describe('extractDecendants', function () {
  let g;
  beforeEach(function () {
    setLogLevel(1);
    g = new graphlib.Graph({
      multigraph: true,
      compound: true
    });
    g.setGraph({
      rankdir: 'TB',
      nodesep: 10,
      ranksep: 10,
      marginx: 8,
      marginy: 8
    });
    g.setDefaultEdgeLabel(function () {
      return {};
    });
  });
  it('Simple case of one level decendants GLB9', function () {
    /*
    subgraph A
      a
    end
    subgraph B
      b
    end
    subgraph C
      c
    end
    A --> B
    A --> C
    */
    g.setNode('a', { data: 1 });
    g.setNode('b', { data: 2 });
    g.setNode('c', { data: 3 });
    g.setParent('a', 'A');
    g.setParent('b', 'B');
    g.setParent('c', 'C');
    g.setEdge('A', 'B', { data: 'link1' }, '1');
    g.setEdge('A', 'C', { data: 'link2' }, '2');

    // logger.info(g.edges())
    const d1 = extractDecendants('A',g)
    const d2 = extractDecendants('B',g)
    const d3 = extractDecendants('C',g)

    expect(d1).toEqual(['a']);
    expect(d2).toEqual(['b']);
    expect(d3).toEqual(['c']);
  });
});
