import graphlib from 'graphlib';
import dagre from 'dagre';
import { validate, adjustClustersAndEdges, extractGraphFromCluster } from './mermaid-graphlib';
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

//     // Add node 'a' to the graph with no label
//     g.setNode('a');

//     // Add node 'b' to the graph with a String label
//     g.setNode('b', 'b's value');

//     // Add node 'c' to the graph with an Object label
//     g.setNode('c', { k: 123 });

//     // What nodes are in the graph?
//     g.nodes();
//     // => `[ 'a', 'b', 'c' ]`

//     // Add a directed edge from 'a' to 'b', but assign no label
//     g.setEdge('a', 'b');

//     // Add a directed edge from 'c' to 'd' with an Object label.
//     // Since 'd' did not exist prior to this call it is automatically
//     // created with an undefined label.
//     g.setEdge('c', 'd', { k: 456 });

//     // What edges are in the graph?
//     g.edges();
//     // => `[ { v: 'a', w: 'b' },
//     //       { v: 'c', w: 'd' } ]`.

//     // Which edges leave node 'a'?
//     g.outEdges('a');
//     // => `[ { v: 'a', w: 'b' } ]`

//     // Which edges enter and leave node 'd'?
//     g.nodeEdges('d');
// // => `[ { v: 'c', w: 'd' } ]`
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

    it('It is possible to copy a cluster to a new graph 1', function () {
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
      g.setParent('a', 'C2');
      g.setParent('b', 'C1');
      g.setParent('C2', 'C1');
      g.setEdge('a', 'b', { name: 'C1-internal-link' });
      g.setEdge('C1', 'c', { name: 'C1-external-link' });

      const newGraph = extractGraphFromCluster('C1', g);
      expect(newGraph.nodes().length).toBe(4);
      expect(newGraph.edges().length).toBe(1);
      logger.info(newGraph.children('C1'));
      expect(newGraph.children('C2')).toEqual(['a']);
      expect(newGraph.children('C1')).toEqual(['b', 'C2']);
      expect(newGraph.edges('a')).toEqual([{ v: 'a', w: 'b' }]);
    });

    it('It is possible to extract a clusters to a new graph 2 GLB1', function () {
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
      g.setNode('c', { data: 3 });
      g.setParent('a', 'C1');
      g.setParent('b', 'C1');
      g.setParent('c', 'C2');
      g.setEdge('a', 'b', { name: 'C1-internal-link' });
      g.setEdge('C1', 'C2', { name: 'C1-external-link' });

      const C1 = extractGraphFromCluster('C1', g);
      const C2 = extractGraphFromCluster('C2', g);

      expect(g.nodes()).toEqual(['C1', 'C2']);
      expect(g.children('C1')).toEqual([]);
      expect(g.children('C2')).toEqual([]);
      expect(g.edges()).toEqual([{ v: 'C1', w: 'C2' }]);

      logger.info(g.nodes());
      expect(C1.nodes()).toEqual(['a', 'C1', 'b']);
      expect(C1.children('C1')).toEqual(['a', 'b']);
      expect(C1.edges()).toEqual([{ v: 'a', w: 'b' }]);

      expect(C2.nodes()).toEqual(['c', 'C2']);
      expect(C2.edges()).toEqual([]);
    });

    it('It is possible to extract a cluster from a graph so that the nodes are removed from original graph', function () {
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
      g.setParent('a', 'C2');
      g.setParent('b', 'C1');
      g.setParent('C2', 'C1');
      g.setEdge('a', 'b', { name: 'C1-internal-link' });
      g.setEdge('C1', 'c', { name: 'C1-external-link' });

      const newGraph = extractGraphFromCluster('C1', g);
      logger.info(g.nodes());
      expect(g.nodes()).toEqual(['c','C1']);
      expect(g.edges().length).toBe(1);
      expect(g.children()).toEqual(['c','C1']);
      expect(g.children('C1')).toEqual([]);
    });
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
      g.setParent('C1', 'C2');
      // g.setEdge('a', 'b', { name: 'C1-internal-link' });
      g.setEdge('C1', 'C2', { name: 'C1-external-link' });

      logger.info(g.nodes())
      adjustClustersAndEdges(g);
      logger.info(g.nodes())
      expect(g.nodes().length).toBe(2);
      expect(validate(g)).toBe(true);
    });
});
