import type { LayoutData } from '../../types.js';
import type { D3Selection } from '../../../types.js';
import { insertCluster } from '../../rendering-elements/clusters.js';
import { insertEdge } from '../../rendering-elements/edges.js';
import { positionNode } from '../../rendering-elements/nodes.js';

export async function adjustLayout(
  data4Layout: LayoutData,
  groups: {
    edgePaths: D3Selection<SVGGElement>;
    rootGroups: D3Selection<SVGGElement>;
    [key: string]: D3Selection<SVGGElement>;
  }
): Promise<void> {
  for (const node of data4Layout.nodes) {
    if (node.isGroup) {
      await insertCluster(groups.clusters, node);
    } else {
      positionNode(node);
    }
  }

  data4Layout.edges.forEach((edge) => {
    insertEdge(
      groups.edgePaths,
      { ...edge },
      {},
      data4Layout.type,
      edge.start,
      edge.end,
      data4Layout.diagramId
    );
  });
}
