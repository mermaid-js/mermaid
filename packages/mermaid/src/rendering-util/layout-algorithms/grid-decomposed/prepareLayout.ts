/**
 * Pre-measurement rewrite: this is where the decomposition happens.
 *
 * Two things are done before the measure stage inserts anything into the DOM:
 *
 *   - subgraph containers, and edges naming one, are removed. That is
 *     `hola-faithful`'s rule (guide §3.2) and its `prepareLayout` is reused
 *     verbatim;
 *   - every tree HOLA's leaf peeling finds is cut off its core and re-rooted on a
 *     *duplicate* of the core node it hung from. The cut edge is not deleted: it
 *     is rewired to the duplicate, so the tree becomes a complete rooted tree
 *     standing on its own and no edge runs between two parts.
 *
 * Both must happen here rather than in the layout core, and for the same reason:
 * the shared painter positions elements the measure stage created
 * (`positionNode` looks the element up by node id), so a node introduced after
 * measuring would have nothing to position, and a label inserted for an edge that
 * is never drawn would have nothing to place it.
 *
 * Deciding which edges to cut needs no sizes — leaf peeling reads adjacency —
 * which is what makes it safe to do this early. The layout core repeats the whole
 * pass defensively, so the DOM-free entry point behaves identically; a second run
 * finds nothing to do, because a re-rooted tree is a component of its own and no
 * longer hangs off a core.
 */

import { log } from '../../../logger.js';
import type { Edge, LayoutData } from '../../types.js';
import { flattenFlowchart } from '../hola-faithful/adapter/flattenFlowchart.js';
import { weaklyConnectedComponents } from '../hola-faithful/components/components.js';
import { decompose } from '../hola-faithful/decomposition/peelCoreAndTrees.js';
import { DiagnosticCollector } from '../hola-faithful/diagnostics.js';
import type { HolaDiagnostic } from '../hola-faithful/diagnostics.js';
import { prepareHolaFaithfulLayout } from '../hola-faithful/prepareLayout.js';
import { createRootCopy } from './rootCopy.js';

/** One tree that was cut off its core and re-rooted on a duplicate. */
export interface DuplicatedRoot {
  /** Id of the duplicate node added to the diagram. */
  copyId: string;
  /** The core node it duplicates. That node stays in the core part. */
  coreNodeId: string;
  /** HOLA's id for the tree this root belongs to. */
  treeId: string;
  /** Edges rewired from the core node onto the duplicate. */
  rewiredEdgeIds: string[];
}

export interface PreparedGridDecomposedLayout {
  /** Ids of subgraph containers removed from the layout graph. */
  removedGroupIds: string[];
  duplicatedRoots: DuplicatedRoot[];
  diagnostics: HolaDiagnostic[];
}

export function prepareGridDecomposedLayout(data: LayoutData): PreparedGridDecomposedLayout {
  const hola = prepareHolaFaithfulLayout(data);

  const diagnostics = new DiagnosticCollector();
  const flat = flattenFlowchart(data, diagnostics);
  const duplicatedRoots: DuplicatedRoot[] = [];

  let treeIndex = 0;
  for (const component of weaklyConnectedComponents(flat.graph)) {
    const decomposition = decompose(component.graph);

    for (const tree of decomposition.trees) {
      const coreNode = flat.originalNodes.get(tree.coreNodeId);
      if (!coreNode) {
        continue;
      }

      // The root copy's edges inside HOLA's tree graph carry the ids of the real
      // Mermaid edges peeling cut — those are the ones to rewire.
      const cutEdgeIds = [...tree.graph.edges.values()]
        .filter((edge) => edge.source === tree.rootCopyId || edge.target === tree.rootCopyId)
        .flatMap((edge) => edge.originalEdgeIds);

      const rewiredEdgeIds: string[] = [];
      for (const edgeId of cutEdgeIds) {
        const edge = flat.originalEdges.get(edgeId);
        if (edge && rewireToCopy(edge, tree.coreNodeId, tree.rootCopyId)) {
          rewiredEdgeIds.push(edgeId);
        }
      }

      if (rewiredEdgeIds.length === 0) {
        // Nothing to hang off the copy, so adding it would leave a stray node.
        continue;
      }

      data.nodes.push(createRootCopy(coreNode, tree.rootCopyId, treeIndex));
      duplicatedRoots.push({
        copyId: tree.rootCopyId,
        coreNodeId: tree.coreNodeId,
        treeId: tree.id,
        rewiredEdgeIds,
      });
      treeIndex++;
    }
  }

  if (duplicatedRoots.length > 0) {
    log.debug(
      `GRID-DECOMPOSED: peeled ${duplicatedRoots.length} tree(s) off their core(s), ` +
        'each re-rooted on a duplicate of the core node it hung from'
    );
  }

  return {
    removedGroupIds: hola.removedGroupIds,
    duplicatedRoots,
    diagnostics: [...hola.diagnostics, ...diagnostics.all()],
  };
}

/**
 * Move whichever end of the edge names the core node onto the duplicate.
 *
 * The edge object itself survives, so its label, its markers and its direction
 * travel with it — the tree part draws the connection it always had, just to a
 * node that stands for the core node rather than to the core node itself.
 */
function rewireToCopy(edge: Edge, coreNodeId: string, copyId: string): boolean {
  if (edge.start === coreNodeId) {
    edge.start = copyId;
    return true;
  }
  if (edge.end === coreNodeId) {
    edge.end = copyId;
    return true;
  }

  return false;
}
