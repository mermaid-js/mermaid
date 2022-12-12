import * as graphlibJson from 'dagre-d3-es/src/graphlib/json';
import * as graphlib from 'dagre-d3-es/src/graphlib.js';
import {
  validate,
  adjustClustersAndEdges,
  extractDescendants,
  sortNodesByHierarchy,
} from './mermaid-graphlib';
import { setLogLevel, log } from '../logger';

describe('Graphlib decorations', () => {
  let g;
  beforeEach(function () {
    setLogLevel(1);
    g = new graphlib.Graph({
      multigraph: true,
      compound: true,
    });
    g.setGraph({
      rankdir: 'TB',
      nodesep: 10,
      ranksep: 10,
      marginx: 8,
      marginy: 8,
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
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setNode('c', { data: 3 });
      g.setParent('a', 'C1');
      g.setParent('b', 'C1');
      g.setParent('c', 'C2');
      g.setEdge('a', 'b');
      g.setEdge('C1', 'C2');

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

      adjustClustersAndEdges(g);
      log.info(g.edges());
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
      log.info(g.nodes());
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

      log.info(g.nodes());
      adjustClustersAndEdges(g);
      log.info(g.nodes());
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

      // log.info(g.edges())
      adjustClustersAndEdges(g);
      log.info(g.edges());
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

      log.info(g.node('C1'));
      adjustClustersAndEdges(g);
      log.info(g.edges());
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

      // log.info(g.edges())
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

      // log.info('Graph before', g.node('D'))
      // log.info('Graph before', graphlibJson.write(g))
      adjustClustersAndEdges(g);
      // log.info('Graph after', graphlibJson.write(g), g.node('C').graph)

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

      log.info('Graph before', g.node('D'));
      log.info('Graph before', graphlibJson.write(g));
      adjustClustersAndEdges(g);
      log.trace('Graph after', graphlibJson.write(g));
      expect(g.nodes()).toEqual(['C', 'B', 'A']);
      expect(g.nodes().length).toBe(3);
      expect(g.edges().length).toBe(2);

      const AGraph = g.node('A').graph;
      const BGraph = g.node('B').graph;
      const CGraph = g.node('C').graph;
      // log.info(CGraph.nodes());
      const DGraph = CGraph.node('D').graph;
      // log.info('DG', CGraph.children('D'));

      log.info('A', AGraph.nodes());
      expect(AGraph.nodes().length).toBe(1);
      expect(AGraph.nodes()).toEqual(['a']);
      log.trace('Nodes', BGraph.nodes());
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

      log.info('Graph before', graphlibJson.write(g));
      adjustClustersAndEdges(g);
      const bGraph = g.node('b').graph;
      // log.trace('Graph after', graphlibJson.write(g))
      log.info('Graph after', graphlibJson.write(bGraph));
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

      log.info('Graph before', graphlibJson.write(g));
      adjustClustersAndEdges(g);
      const aGraph = g.node('a').graph;
      const bGraph = aGraph.node('b').graph;
      log.info('Graph after', graphlibJson.write(aGraph));
      const cGraph = bGraph.node('c').graph;
      // log.trace('Graph after', graphlibJson.write(g))
      expect(aGraph.nodes().length).toBe(1);
      expect(bGraph.nodes().length).toBe(1);
      expect(cGraph.nodes().length).toBe(1);
      expect(bGraph.edges().length).toBe(0);
    });
  });
  it('adjustClustersAndEdges should handle nesting GLB77', function () {
    /*
flowchart TB
  subgraph A
    b-->B
    a-->c
  end
  subgraph B
    c
  end
    */

    const exportedGraph = JSON.parse(
      '{"options":{"directed":true,"multigraph":true,"compound":true},"nodes":[{"v":"A","value":{"labelStyle":"","shape":"rect","labelText":"A","rx":0,"ry":0,"class":"default","style":"","id":"A","width":500,"type":"group","padding":15}},{"v":"B","value":{"labelStyle":"","shape":"rect","labelText":"B","rx":0,"ry":0,"class":"default","style":"","id":"B","width":500,"type":"group","padding":15},"parent":"A"},{"v":"b","value":{"labelStyle":"","shape":"rect","labelText":"b","rx":0,"ry":0,"class":"default","style":"","id":"b","padding":15},"parent":"A"},{"v":"c","value":{"labelStyle":"","shape":"rect","labelText":"c","rx":0,"ry":0,"class":"default","style":"","id":"c","padding":15},"parent":"B"},{"v":"a","value":{"labelStyle":"","shape":"rect","labelText":"a","rx":0,"ry":0,"class":"default","style":"","id":"a","padding":15},"parent":"A"}],"edges":[{"v":"b","w":"B","name":"1","value":{"minlen":1,"arrowhead":"normal","arrowTypeStart":"arrow_open","arrowTypeEnd":"arrow_point","thickness":"normal","pattern":"solid","style":"fill:none","labelStyle":"","arrowheadStyle":"fill: #333","labelpos":"c","labelType":"text","label":"","id":"L-b-B","classes":"flowchart-link LS-b LE-B"}},{"v":"a","w":"c","name":"2","value":{"minlen":1,"arrowhead":"normal","arrowTypeStart":"arrow_open","arrowTypeEnd":"arrow_point","thickness":"normal","pattern":"solid","style":"fill:none","labelStyle":"","arrowheadStyle":"fill: #333","labelpos":"c","labelType":"text","label":"","id":"L-a-c","classes":"flowchart-link LS-a LE-c"}}],"value":{"rankdir":"TB","nodesep":50,"ranksep":50,"marginx":8,"marginy":8}}'
    );
    const gr = graphlibJson.read(exportedGraph);

    log.info('Graph before', graphlibJson.write(gr));
    adjustClustersAndEdges(gr);
    const aGraph = gr.node('A').graph;
    const bGraph = aGraph.node('B').graph;
    log.info('Graph after', graphlibJson.write(aGraph));
    // log.trace('Graph after', graphlibJson.write(g))
    expect(aGraph.parent('c')).toBe('B');
    expect(aGraph.parent('B')).toBe(undefined);
  });
});
describe('extractDescendants', function () {
  let g;
  beforeEach(function () {
    setLogLevel(1);
    g = new graphlib.Graph({
      multigraph: true,
      compound: true,
    });
    g.setGraph({
      rankdir: 'TB',
      nodesep: 10,
      ranksep: 10,
      marginx: 8,
      marginy: 8,
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

    // log.info(g.edges())
    const d1 = extractDescendants('A', g);
    const d2 = extractDescendants('B', g);
    const d3 = extractDescendants('C', g);

    expect(d1).toEqual(['a']);
    expect(d2).toEqual(['b']);
    expect(d3).toEqual(['c']);
  });
});
describe('sortNodesByHierarchy', function () {
  let g;
  beforeEach(function () {
    setLogLevel(1);
    g = new graphlib.Graph({
      multigraph: true,
      compound: true,
    });
    g.setGraph({
      rankdir: 'TB',
      nodesep: 10,
      ranksep: 10,
      marginx: 8,
      marginy: 8,
    });
    g.setDefaultEdgeLabel(function () {
      return {};
    });
  });
  it('should sort proper en nodes are in reverse order', function () {
    /*
  a -->b
  subgraph B
  b
  end
  subgraph A
  B
  end
    */
    g.setNode('a', { data: 1 });
    g.setNode('b', { data: 2 });
    g.setParent('b', 'B');
    g.setParent('B', 'A');
    g.setEdge('a', 'b', '1');
    expect(sortNodesByHierarchy(g)).toEqual(['a', 'A', 'B', 'b']);
  });
  it('should sort proper en nodes are in correct order', function () {
    /*
  a -->b
  subgraph B
  b
  end
  subgraph A
  B
  end
    */
    g.setNode('a', { data: 1 });
    g.setParent('B', 'A');
    g.setParent('b', 'B');
    g.setNode('b', { data: 2 });
    g.setEdge('a', 'b', '1');
    expect(sortNodesByHierarchy(g)).toEqual(['a', 'A', 'B', 'b']);
  });
});
