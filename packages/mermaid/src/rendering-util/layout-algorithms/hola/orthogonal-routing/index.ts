import edgeRouting from '../edgeRouting.js';
import orthogonalEdgeRouting from './orthogonalEdgeRouting.js';
import type { Edge, LayoutData } from '../../../types.js';

export default function routing(
  data4Layout: LayoutData,
  logStep: (stepName: string) => void
): Edge[] {
  const { nodes, edges } = data4Layout;

  if (!nodes?.length || !edges?.length) {
    return edges || [];
  }
  // Step 1: Calculate sides and connection points
  const updatedLayout = edgeRouting(data4Layout);
  logStep('Assigning node sides to edges');

  // Step 2: Generate orthogonal paths between connection points
  const orthogonalLayout = orthogonalEdgeRouting(updatedLayout, logStep);

  return orthogonalLayout.edges;
}
