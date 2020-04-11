import dagre from 'dagre';

// Create a new directed graph
var g = new dagre.graphlib.Graph({ compound: true });

// Set an object for the graph label
g.setGraph({});

// Default to assigning a new object as a label for each new edge.
g.setDefaultEdgeLabel(function() {
  return {};
});

// Add nodes to the graph. The first argument is the node id. The second is
// metadata about the node. In this case we're going to add labels to each of
// our nodes.
g.setNode('root', { label: 'Cluster' });
g.setNode('kspacey', { label: 'Kevin Spacey', width: 144, height: 100, x: 200 });
// g.setParent('kspacey', 'root');
g.setNode('swilliams', { label: 'Saul Williams', width: 160, height: 100 });
// g.setNode('bpitt', { label: 'Brad Pitt', width: 108, height: 100 });
// g.setNode('hford', { label: 'Harrison Ford', width: 168, height: 100 });
// g.setNode('lwilson', { label: 'Luke Wilson', width: 144, height: 100 });
// g.setNode('kbacon', { label: 'Kevin Bacon', width: 121, height: 100 });

// Add edges to the graph.
g.setEdge('kspacey', 'swilliams');
g.setEdge('swilliams');
// g.setEdge('swilliams', 'kbacon');
// g.setEdge('bpitt', 'kbacon');
// g.setEdge('hford', 'lwilson');
// g.setEdge('lwilson', 'kbacon');

dagre.layout(g);

g.nodes().forEach(function(v) {
  console.log('Node ' + v + ': ' + JSON.stringify(g.node(v)));
});
g.edges().forEach(function(e) {
  console.log('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
});
