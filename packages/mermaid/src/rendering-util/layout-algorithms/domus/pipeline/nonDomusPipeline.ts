import type { LayoutData, Node, Edge } from '../../../types.js';
import { log } from '../../../../logger.js';
import type { OrthogonalOptions, PortSide } from '../types.js';
import type { OrthoPipelineContext } from './context.js';
import { ORTHO_DEBUG } from '../debug.js';

import { preprocessClusters } from '../cluster.js';
import { inferEdgeLabelParentIds } from './labelParents.js';
import { assignPortsForEdge, chooseBoundaryPortOutsideOtherNodes } from '../core/portAssignment.js';
import { rectForNode } from '../core/helpers.js';
import { inferPortSideFromPointOnRect, snapPortForRoutingOnSide } from './ports.js';
import type { CompoundBoundaryStep } from './compoundBoundary.js';
import { buildCompoundBoundarySteps } from './compoundBoundary.js';
import { allocateBoundaryTs } from './compoundBoundary.js';
import { createPortTAllocator } from './portDistribution.js';
import { routeEdges } from './routeEdges.js';
import { applyPostRoutingPasses } from './postprocess.js';
import { applyOcrFallbackIfNeeded } from './ocrFallback.js';
import { applyPortStubRepairIfNeeded } from './portStubRepair.js';
import { applyIncrementalNeighborhoodPostprocess } from './incrementalPostprocess.js';
import { trimPortTailHug } from './trimPortTailHug.js';
import { emitLayoutDump } from './dump.js';
import { ancestorGroupIds, commonPrefixLen } from './groups.js';
import { snapEndpointsToBoundaries } from './snapEndpointsToBoundaries.js';
import { repairShortEndpointStubs } from './endpointStubRepair.js';

export function runNonDomusPipeline(args: {
  data: LayoutData;
  options: OrthogonalOptions;
  ctx: OrthoPipelineContext;
}): LayoutData {
  const { data, options, ctx } = args;
  const backend = ctx.backend;
  if (backend === 'domus') {
    throw new Error('runNonDomusPipeline called with backend==="domus"');
  }

  const trace = options.trace;
  const spacing = options.spacing ?? 10;
  const clearance = options.clearance ?? spacing;

  const changedNodeIds = new Set(options.incremental?.changedNodeIds ?? []);
  const changedEdgeIds = new Set(options.incremental?.changedEdgeIds ?? []);
  const incrementalEnabled = changedNodeIds.size > 0 || changedEdgeIds.size > 0;

  const shouldRouteEdge = (edge: Edge): boolean => {
    if (!incrementalEnabled) {
      return true;
    }
    const edgeId = edge?.id != null ? String(edge.id) : '';
    if (edgeId && changedEdgeIds.has(edgeId)) {
      return true;
    }
    const s = edge.start != null ? String(edge.start) : '';
    const t = edge.end != null ? String(edge.end) : '';
    if ((s && changedNodeIds.has(s)) || (t && changedNodeIds.has(t))) {
      return true;
    }
    // If there is no existing geometry, we must route it even in incremental mode.
    if (!edge.points || edge.points.length < 2) {
      return true;
    }
    return false;
  };

  if (trace) {
    trace.stages.push({ name: 'port-assignment' });
    trace.stages.push({ name: 'routing' });
  }

  // Cluster pre-pass: compute group bounds bottom-up so groups are meaningful rectangles.
  preprocessClusters(data, options);

  const nodesById = new Map<string, Node>();
  for (const node of data.nodes) {
    if (node.id != null) {
      nodesById.set(String(node.id), node);
    }
  }

  // Before cluster preprocessing and routing, fix up edge-label node group
  // context so "I -> edge-label-I-K-..." is treated as an internal-to-group
  // route when appropriate.
  inferEdgeLabelParentIds(nodesById, data.edges ?? []);

  const groupsById = new Map<string, Node>();
  for (const [id, node] of nodesById) {
    if ((node as any).isGroup) {
      groupsById.set(id, node);
    }
  }

  // Post-processing (ordering/spacing/nudging) currently assumes leaf-node obstacles.
  // Treating group rectangles as solid obstacles can break compound routing paths
  // by pushing internal tracks outside group boundaries.
  const nodesByIdNoGroups = new Map<string, Node>();
  for (const [id, node] of nodesById) {
    if (!(node as any).isGroup) {
      nodesByIdNoGroups.set(id, node);
    }
  }

  // Precompute deterministic boundary attachment offsets (t) for compound/group boundary ports.
  // This avoids multiple edges attaching to the exact same boundary coordinate.
  const compoundStepsByEdgeId = new Map<string, CompoundBoundaryStep[]>();
  if (backend === 'routing-graph') {
    for (const edge of data.edges ?? []) {
      if (!edge.start || !edge.end) {
        continue;
      }
      const startNodeId = String(edge.start);
      const endNodeId = String(edge.end);
      const startNode = nodesById.get(startNodeId);
      const endNode = nodesById.get(endNodeId);
      if (!startNode || !endNode) {
        continue;
      }

      const startAnc = ancestorGroupIds(startNode, nodesById);
      const endAnc = ancestorGroupIds(endNode, nodesById);
      const cp = commonPrefixLen(startAnc, endAnc);
      const leaving = startAnc.slice(cp).reverse();
      const entering = endAnc.slice(cp);
      if (leaving.length === 0 && entering.length === 0) {
        continue;
      }

      const edgeId = String(edge.id ?? `${startNodeId}->${endNodeId}`);
      const ports = assignPortsForEdge(startNode, endNode);
      const safeStartPort =
        chooseBoundaryPortOutsideOtherNodes(startNodeId, endNodeId, nodesById, {
          preferredSide: ports.startSide,
          candidatePort: ports.startPort,
        }) ?? ports.startPort;

      // For compound edges, we need routing-grid-consistent ports; otherwise tiny kinks can appear
      // at the cluster boundary (e.g. group boundary snaps to spacing grid but node port does not).
      const rs = rectForNode(startNode);
      const ss = inferPortSideFromPointOnRect(safeStartPort, rs) ?? ports.startSide;
      const safeStartPortSnapped = snapPortForRoutingOnSide(rs, ss, safeStartPort, spacing);

      compoundStepsByEdgeId.set(
        edgeId,
        buildCompoundBoundarySteps(edgeId, startNode, endNode, nodesById, safeStartPortSnapped)
      );
    }
  }
  const boundaryTByRequestId = allocateBoundaryTs(compoundStepsByEdgeId);

  // Step 3 — deterministic port distribution:
  // If multiple edges attach to the same node side, distribute their ports along the side
  // in a stable order derived from geometry (target direction), not edge id.
  // This does NOT change side selection, only the t-parameter along the chosen side.
  const { tByEdgeEndpointKey, ensureTsForNodeSide } =
    backend === 'routing-graph'
      ? createPortTAllocator({ data, nodesById })
      : {
          tByEdgeEndpointKey: new Map<string, number>(),
          ensureTsForNodeSide: (_n: string, _s: PortSide) => {
            /* noop */
          },
        };

  if (backend === 'routing-graph') {
    log.debug(ORTHO_DEBUG, 'PORT_HARDENING_T_ALLOC', {
      enabled: ctx.shouldHardenPorts,
      endpoints: tByEdgeEndpointKey.size,
    });
  }

  routeEdges({
    data,
    options,
    backend,
    nodesById,
    nodesByIdNoGroups,
    groupsById,
    spacing,
    clearance,
    shouldHardenPorts: ctx.shouldHardenPorts,
    incrementalEnabled,
    shouldRouteEdge,
    changedEdgeIds,
    trace,
    compoundStepsByEdgeId,
    boundaryTByRequestId,
    tByEdgeEndpointKey,
    ensureTsForNodeSide,
  });

  applyPostRoutingPasses({
    data,
    nodesById,
    nodesByIdNoGroups,
    groupsById,
    backend,
    spacing,
    clearance,
    options,
    incrementalEnabled,
  });

  applyOcrFallbackIfNeeded({
    data,
    options,
    nodesById,
    nodesByIdNoGroups,
    groupsById,
    spacing,
    backend,
    incrementalEnabled,
    tByEdgeEndpointKey,
    trace,
    compoundStepsByEdgeId,
  });

  applyPortStubRepairIfNeeded({ data, options, backend, incrementalEnabled });

  if (trace) {
    trace.stages.push({ name: 'path-ordering' });
    trace.stages.push({ name: 'spacing' });
  }

  applyIncrementalNeighborhoodPostprocess({
    data,
    nodesByIdNoGroups,
    spacing,
    incrementalEnabled,
    changedEdgeIds,
  });

  const { trimmed } = trimPortTailHug(data);
  if (trimmed > 0) {
    log.debug(ORTHO_DEBUG, 'PORT_TAIL_HUG_TRIMMED', { trimmed });
  }

  const fallbackSnapStats = snapEndpointsToBoundaries(data, { tolerance: 1.5 });
  if (fallbackSnapStats.snapped > 0) {
    log.debug(ORTHO_DEBUG, 'NON_DOMUS_ENDPOINT_SNAP', fallbackSnapStats);
  }
  const endpointRepairs = repairShortEndpointStubs(data, { minLength: spacing });
  if (endpointRepairs.repaired > 0) {
    log.debug(ORTHO_DEBUG, 'NON_DOMUS_ENDPOINT_STUB_REPAIR', endpointRepairs);
  }
  applyPortStubRepairIfNeeded({ data, options, backend, incrementalEnabled });

  emitLayoutDump(data);

  return data;
}
