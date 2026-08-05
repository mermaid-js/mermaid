import type { LayoutData, Node } from '../../../types.js';
import { StressMinimizer } from './stressMinimizer.js';
import { OrthogonalLayouter } from './orthogonalLayouter.js';
import { findConnectedComponents, layoutDisconnectedComponents } from './graphUtils.js';

export function layoutCoreGraph(coreData: LayoutData, edgeLength: number): LayoutData {
  if (!coreData.nodes || coreData.nodes.length === 0) {
    return coreData;
  }

  if (coreData.nodes.length === 1) {
    const node = { ...coreData.nodes[0], x: 0, y: 0 };
    return {
      ...coreData,
      nodes: [node],
      edges: coreData.edges || [],
    };
  }

  const components = findConnectedComponents(coreData);
  if (components.length > 1) {
    return layoutDisconnectedComponents(coreData, components, (data) =>
      layoutCoreGraph(data, edgeLength)
    );
  }

  const uniformEdgeLength = edgeLength;

  // Step 2a: Stress-Minimizing Placement
  const stressMinimizer = new StressMinimizer(coreData, uniformEdgeLength);
  const stressOptimizedNodes = stressMinimizer.minimize();

  // stressMinimizer.removeOverlaps();

  // Step 2b: Greedy Orthogonalization
  const orthogonalLayout = new OrthogonalLayouter(
    stressOptimizedNodes,
    coreData.edges ?? [],
    uniformEdgeLength
  );

  orthogonalLayout.orthogonalizeAllEdges();

  coreData.nodes.forEach((node) => {
    const updatedNode = stressOptimizedNodes.get(node.id);
    if (updatedNode) {
      node.x = updatedNode.x;
      node.y = updatedNode.y;
    }
  });

  const finalNodes: Node[] = [...stressOptimizedNodes.values()].map((node) => ({
    ...coreData.nodes.find((n) => n.id === node.id)!,
    x: node.x,
    y: node.y,
  }));

  return {
    ...coreData,
    nodes: finalNodes,
    edges: coreData.edges,
  };
}
