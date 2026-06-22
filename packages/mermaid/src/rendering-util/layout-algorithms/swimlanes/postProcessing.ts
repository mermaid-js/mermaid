// cspell:ignore raykov Wybrow
import type { LayoutData } from '../../types.js';
import {
  clipEdgeEndpointsToNodeBoundaries,
  prepareEdgeEndpointsForRenderer,
} from './direction/endpointClip.js';
import { orthogonalizePolyline, simplifyPolyline } from './direction/geometry.js';
import { applyBtDirectionTransform, applyLrDirectionTransform } from './direction/lrTransform.js';
import { portSwapToLShape } from './direction/portSwap.js';
import { collapseShortTerminalStub } from './direction/terminalStub.js';
import {
  collapseRedundantRectangularDoglegs,
  resolveRenderedOrthogonalCrossings,
  separateSharedRenderedTerminalLanes,
} from './direction/materializedGeometry.js';
import { simplifyDetouredEdges } from './direction/detourSimplification.js';
import { anchorLabelsToPolyline } from './direction/labelAnchoring.js';
import { straightenCollinearSiblingDetours } from './direction/siblingSharedFaceRouting.js';
import { nudgeSharedInteriorSubpaths } from './direction/sharedTrackNudging.js';
export { validateSwimlanesLayout } from './direction/validation.js';

/** Applies direction transforms and post-routing cleanup to a swimlane layout. */
export function postProcessSwimlaneLayout(layout: LayoutData, direction?: string): void {
  const nodes = layout.nodes ?? [];
  const edges = layout.edges ?? [];
  const contentNodes = nodes.filter((n) => !n.isGroup);

  // TB is the canonical orientation. LR/RL rotate rank progression onto X;
  // BT mirrors the canonical Y progression. Cleanup passes below operate in
  // whichever coordinate system this step leaves behind.
  if (
    (direction === 'LR' || direction === 'RL') &&
    contentNodes.length > 0 &&
    !applyLrDirectionTransform(layout, direction)
  ) {
    return;
  }

  if (direction === 'BT' && contentNodes.length > 0 && !applyBtDirectionTransform(layout)) {
    return;
  }

  for (const edge of edges) {
    if ((edge as { isLayoutOnly?: boolean }).isLayoutOnly) {
      continue;
    }
    const pts = (edge as { points?: { x: number; y: number }[] }).points;
    if (!pts || pts.length < 2) {
      continue;
    }
    (edge as { points: { x: number; y: number }[] }).points = simplifyPolyline(
      orthogonalizePolyline(pts)
    );
  }

  simplifyDetouredEdges(edges as any[], nodes);

  // Prefer shorter sibling routes when a local port shift keeps them clear.
  straightenCollinearSiblingDetours(edges as any[], nodes);

  // Swap a source port only when it produces a clear L-shape with fewer bends.
  portSwapToLShape(edges as any[], nodes);

  const nodeByIdMap = new Map<string, any>();
  for (const n of nodes) {
    nodeByIdMap.set(String(n.id), n);
  }
  // Initial label anchoring against the routed polylines. The cleanup passes
  // below (nudging, terminal-lane splits, crossing resolution) can still reshape
  // these polylines, so labels are re-anchored once more at the end.
  anchorLabelsToPolyline(edges, nodeByIdMap);

  clipEdgeEndpointsToNodeBoundaries(edges, nodeByIdMap);

  // Retarget short terminal stubs that are hidden by endpoint clipping.
  collapseShortTerminalStub(edges, nodeByIdMap);

  // Wybrow-style shared-track nudge. The router may legitimately bundle
  // connectors onto the same rail, but before rendering those coincident
  // middle rails must be separated into nearby parallel tracks. This pass
  // keeps endpoint stubs pinned and only offsets interior H/V segments whose
  // same-axis span overlaps another edge.
  nudgeSharedInteriorSubpaths(edges, nodeByIdMap);

  // Materialized-render terminal lane split. The raw layout can still look
  // valid while the renderer's endpoint clipping creates coincident first/last
  // stubs on a shared node face. Split those visible terminal rails before the
  // endpoint-duplication handoff pins them.
  separateSharedRenderedTerminalLanes(edges, nodeByIdMap);

  // Once terminal lanes have been separated, some earlier same-track detours
  // become unnecessary. Remove only provably redundant rectangular doglegs;
  // safety checks preserve obstacle clearance and the newly split lanes.
  collapseRedundantRectangularDoglegs(edges, nodeByIdMap);

  // Wybrow-style crossing cleanup for the materialized render geometry. This
  // pass only activates when strict H/V crossings remain after the lower-level
  // nudging passes. It tries bounded port-pair and outer-channel candidates,
  // preserving obstacle clearance and accepting only candidates that reduce the
  // rendered crossing count.
  resolveRenderedOrthogonalCrossings(edges, nodeByIdMap);

  // Re-anchor labels: the passes above reshaped several polylines after the
  // initial anchoring, so labels must be snapped to the final geometry.
  anchorLabelsToPolyline(edges, nodeByIdMap);

  prepareEdgeEndpointsForRenderer(edges, nodeByIdMap);
}
