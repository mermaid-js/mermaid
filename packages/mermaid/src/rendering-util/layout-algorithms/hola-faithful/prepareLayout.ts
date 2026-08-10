/**
 * Pre-measurement rewrite.
 *
 * Guide §3.2 drops subgraph containers and any edge that names one. Doing that
 * inside `runLayoutCore` would be too late in the browser: measurement runs
 * first, so a container label and an unsupported edge's label would already
 * have been inserted into the DOM and would then linger with no position.
 *
 * Removing them here means the measure stage only ever sees what will be drawn.
 * The layout core performs the same removal defensively, so the DOM-free entry
 * point used by DDLT and the unit tests stays correct on its own.
 */

import { log } from '../../../logger.js';
import type { LayoutData } from '../../types.js';
import { DiagnosticCollector } from './diagnostics.js';
import type { HolaDiagnostic } from './diagnostics.js';

export interface PreparedHolaFaithfulLayout {
  /** Ids of subgraph containers removed from the layout graph. */
  removedGroupIds: string[];
  /** Ids of edges omitted because an endpoint was a container. */
  removedEdgeIds: string[];
  diagnostics: HolaDiagnostic[];
}

export function prepareHolaFaithfulLayout(data: LayoutData): PreparedHolaFaithfulLayout {
  const diagnostics = new DiagnosticCollector();
  const groupIds = new Set(
    (data.nodes ?? []).filter((node) => node.isGroup === true).map((node) => node.id)
  );

  const removedEdgeIds: string[] = [];
  if (groupIds.size > 0) {
    data.edges = (data.edges ?? []).filter((edge) => {
      const touchesGroup =
        (edge.start !== undefined && groupIds.has(edge.start)) ||
        (edge.end !== undefined && groupIds.has(edge.end));
      if (!touchesGroup) {
        return true;
      }
      removedEdgeIds.push(edge.id);
      diagnostics.report({
        code: 'HOLA_SUBGRAPH_ENDPOINT_UNSUPPORTED',
        stage: 'prepare',
        edgeIds: [edge.id],
        nodeIds: [edge.start, edge.end].filter(
          (id): id is string => id !== undefined && groupIds.has(id)
        ),
        message:
          'An edge endpoint is a subgraph container. Containers are not rendered by ' +
          'hola-faithful, so the edge is omitted rather than redirected to an arbitrary child.',
      });
      return false;
    });

    data.nodes = data.nodes.filter((node) => node.isGroup !== true);
    for (const node of data.nodes) {
      node.parentId = undefined;
    }
  }

  const result: PreparedHolaFaithfulLayout = {
    removedGroupIds: [...groupIds],
    removedEdgeIds,
    diagnostics: diagnostics.all(),
  };

  if (groupIds.size > 0) {
    log.warn(
      `[hola-faithful] flattened ${groupIds.size} subgraph container(s); ` +
        `${removedEdgeIds.length} edge(s) to a container were omitted.`
    );
  }

  return result;
}
