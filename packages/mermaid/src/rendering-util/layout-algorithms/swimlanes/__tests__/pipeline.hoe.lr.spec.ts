import { describe, it, expect } from 'vitest';
import type { LayoutData, Edge } from '../../../types.js';
import { toGraphView, writeBackToLayoutData } from '../helpers.js';
import { sugiyamaLayout } from '../pipeline.js';
import { routeEdgesOrthogonal } from '../orthogonalRouter/router.js';
import { postProcessSwimlaneLayout as applySwimlaneDirectionTransform } from '../postProcessing.js';
import { createEdgeLabelNodes } from '../edgeLabelNodes.js';
import { validateLayout } from '../../layout-utils/validateLayout.js';

interface TestEdge extends Edge {
  start: string;
  end: string;
}

interface Point {
  x: number;
  y: number;
}

function makeHoELayout(direction: 'LR' | 'TB' = 'LR'): LayoutData {
  const nodes: any[] = [
    {
      id: 'HoE',
      isGroup: true,
      width: 420,
      height: 180,
    },
    {
      id: 'StatusSeeker',
      isGroup: true,
      width: 320,
      height: 180,
    },
    {
      id: 'TechLead',
      isGroup: true,
      width: 300,
      height: 180,
    },
    {
      id: 'HE_CA',
      parentId: 'HoE',
      isGroup: false,
      width: 110,
      height: 70,
    },
    {
      id: 'HE_Ans',
      parentId: 'HoE',
      isGroup: false,
      width: 90,
      height: 45,
    },
    {
      id: 'HE_Inv',
      parentId: 'HoE',
      isGroup: false,
      width: 110,
      height: 45,
    },
    {
      id: 'HE_Ans2',
      parentId: 'HoE',
      isGroup: false,
      width: 90,
      height: 45,
    },
    {
      id: 'A',
      parentId: 'StatusSeeker',
      isGroup: false,
      width: 110,
      height: 45,
    },
    {
      id: 'B',
      parentId: 'StatusSeeker',
      isGroup: false,
      width: 120,
      height: 70,
    },
    {
      id: 'TL_CA',
      parentId: 'TechLead',
      isGroup: false,
      width: 110,
      height: 70,
    },
    {
      id: 'TL_Ans',
      parentId: 'TechLead',
      isGroup: false,
      width: 90,
      height: 45,
    },
  ];

  const edges: TestEdge[] = [
    { id: 'eHE_CA-HE_Ans', start: 'HE_CA', end: 'HE_Ans', type: 'arrow_point', label: 'Yes' },
    { id: 'eHE_CA-HE_Inv', start: 'HE_CA', end: 'HE_Inv', type: 'arrow_point', label: 'No' },
    { id: 'eHE_Inv-HE_Ans2', start: 'HE_Inv', end: 'HE_Ans2', type: 'arrow_point' },
    { id: 'eA-B', start: 'A', end: 'B', type: 'arrow_point' },
    { id: 'eTL_CA-TL_Ans', start: 'TL_CA', end: 'TL_Ans', type: 'arrow_point', label: 'Yes' },
    { id: 'eB-TL_CA', start: 'B', end: 'TL_CA', type: 'arrow_point', label: 'Yes' },
    { id: 'eB-HE_CA', start: 'B', end: 'HE_CA', type: 'arrow_point', label: 'No' },
    { id: 'eTL_CA-HE_CA', start: 'TL_CA', end: 'HE_CA', type: 'arrow_point', label: 'No' },
  ];

  const layout: LayoutData = {
    nodes: nodes as any,
    edges,
    config: {
      flowchart: {
        nodeSpacing: 40,
        rankSpacing: 90,
        ignoreCrossLaneEdges: true,
        optimizeRanksByCrossings: true,
      },
    } as any,
  } as any;

  (layout as any).direction = direction;

  return layout;
}

function sizeLabelNode(nodeId: string, layout: LayoutData, width: number, height: number) {
  const labelNode = layout.nodes.find((n: any) => n.id === nodeId);
  if (labelNode) {
    labelNode.width = width;
    labelNode.height = height;
  }
}

function labelNodeIdForEdge(layout: LayoutData, edgeId: string): string | undefined {
  const edge = layout.edges?.find((edge) => edge.id === edgeId) as
    | (Edge & { labelNodeId?: string })
    | undefined;
  return edge?.labelNodeId;
}

function runHoESwimlanesLR(): { layout: LayoutData; labelNodeId?: string } {
  const baseLayout = makeHoELayout('LR');
  const layout = createEdgeLabelNodes(baseLayout);

  sizeLabelNode(labelNodeIdForEdge(layout, 'eHE_CA-HE_Ans') ?? '', layout, 42, 22);
  sizeLabelNode(labelNodeIdForEdge(layout, 'eHE_CA-HE_Inv') ?? '', layout, 38, 22);
  sizeLabelNode(labelNodeIdForEdge(layout, 'eTL_CA-TL_Ans') ?? '', layout, 42, 22);
  sizeLabelNode(labelNodeIdForEdge(layout, 'eB-TL_CA') ?? '', layout, 42, 22);
  sizeLabelNode(labelNodeIdForEdge(layout, 'eB-HE_CA') ?? '', layout, 38, 22);
  sizeLabelNode(labelNodeIdForEdge(layout, 'eTL_CA-HE_CA') ?? '', layout, 38, 22);

  const g = toGraphView(layout);
  const nodeGap = layout.config.flowchart?.nodeSpacing ?? 40;
  const layerGap = layout.config.flowchart?.rankSpacing ?? 90;

  const { ordered, coordinates } = sugiyamaLayout(g, {
    nodeGap,
    layerGap,
    ignoreCrossLaneEdges: true,
    optimizeRanksByCrossings: true,
    direction: 'LR',
  });

  writeBackToLayoutData(g, ordered, coordinates, { nodeGap, layerGap });

  for (const edge of layout.edges ?? []) {
    delete (edge as any).points;
  }

  routeEdgesOrthogonal(layout, 'LR');
  applySwimlaneDirectionTransform(layout, 'LR');

  return { layout, labelNodeId: labelNodeIdForEdge(layout, 'eB-HE_CA') };
}

function hasZeroProgressOutAndBack(points: Point[]): boolean {
  if (points.length < 3) {
    return false;
  }

  const first = points[0];
  const last = points[points.length - 1];
  return Math.abs(first.x - last.x) < 1 && Math.abs(first.y - last.y) < 1;
}

function hasEarlyReturnToStartRow(points: Point[]): boolean {
  if (points.length < 5) {
    return false;
  }

  const start = points[0];
  for (let i = 2; i < points.length - 1; i++) {
    const p = points[i];
    const sameRow = Math.abs(p.y - start.y) < 1;
    const movedAway =
      points.slice(1, i).some((q) => Math.abs(q.y - start.y) > 1) ||
      points.slice(1, i).some((q) => Math.abs(q.x - start.x) > 1);
    if (sameRow && movedAway) {
      return true;
    }
  }
  return false;
}

describe('Swimlanes LR HoE integration', () => {
  // Rewritten for Strategy 1 (iter 5+). The old assertions referenced
  // split-edge IDs (`eB-HE_CA-to-label` / `eB-HE_CA-from-label`) that
  // no longer exist — under Strategy 1 every labelled edge is a single
  // unbroken polyline with a `labelNodeId` stamp, and the label is
  // anchored onto a middle segment of that polyline post-routing.
  //
  // The surviving quality properties (no spikes, no local hooks, no
  // sideways jogs near labels, labels on their own edge's polyline)
  // are now covered by validateLayout's hard invariants plus the
  // labelOnPolyline structural check. These tests run the full
  // Strategy 1 pipeline on the hand-constructed HoE fixture and pin
  // the layout-level invariants.

  it('Level 1: validateLayout — HoE fixture produces a valid orthogonal layout', () => {
    const { layout } = runHoESwimlanesLR();
    const result = validateLayout(layout);
    if (!result.ok) {
      console.log('[SWIMLANE_HOE] validateLayout issues:', JSON.stringify(result.issues, null, 2));
    }
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('Level 2: every labelled edge has its label center on a polyline segment', () => {
    // Strategy 1 invariant: each labelled edge's label is anchored to a
    // middle segment of its own routed polyline, so `labelNode.x/y`
    // lies on the polyline by construction.
    const { layout } = runHoESwimlanesLR();
    const nodeById = new Map<string, any>();
    for (const n of layout.nodes) {
      nodeById.set(n.id, n);
    }
    const EPS = 1;
    const offenders: {
      edgeId: string;
      labelId: string;
      labelCenter: { x: number; y: number };
    }[] = [];
    for (const edge of layout.edges ?? []) {
      const labelId = (edge as { labelNodeId?: string }).labelNodeId;
      if (!labelId) {
        continue;
      }
      const labelNode = nodeById.get(labelId);
      if (!labelNode) {
        continue;
      }
      const pts = (edge as { points?: { x: number; y: number }[] }).points;
      if (!pts || pts.length < 2) {
        continue;
      }
      const lcx = labelNode.x ?? 0;
      const lcy = labelNode.y ?? 0;
      let onSegment = false;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const sameY = Math.abs(a.y - b.y) < 1e-6;
        const sameX = Math.abs(a.x - b.x) < 1e-6;
        if (sameY) {
          const minX = Math.min(a.x, b.x);
          const maxX = Math.max(a.x, b.x);
          if (Math.abs(lcy - a.y) < EPS && lcx >= minX - EPS && lcx <= maxX + EPS) {
            onSegment = true;
            break;
          }
        } else if (sameX) {
          const minY = Math.min(a.y, b.y);
          const maxY = Math.max(a.y, b.y);
          if (Math.abs(lcx - a.x) < EPS && lcy >= minY - EPS && lcy <= maxY + EPS) {
            onSegment = true;
            break;
          }
        }
      }
      if (!onSegment) {
        offenders.push({
          edgeId: edge.id ?? '<unnamed>',
          labelId,
          labelCenter: { x: lcx, y: lcy },
        });
      }
    }
    if (offenders.length > 0) {
      console.log('[SWIMLANE_HOE] label-off-polyline:', JSON.stringify(offenders, null, 2));
    }
    expect(offenders).toEqual([]);
  });

  it('Level 2: edge polylines have no spikes, collinear intermediates, or zero-progress out-and-back', () => {
    // Covers the intent of the original "no hooks or loops" test:
    // labelled edges should not contain zero-area spikes or polylines
    // that return to their starting coordinate after wandering.
    const { layout } = runHoESwimlanesLR();
    const EPS = 1e-6;
    interface Offender {
      edgeId: string;
      kind: 'spike' | 'collinear' | 'zeroProgress';
    }
    const offenders: Offender[] = [];
    for (const edge of layout.edges ?? []) {
      const pts = (edge as { points?: Point[] }).points ?? [];
      // Spike / collinear check.
      for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1];
        const cur = pts[i];
        const next = pts[i + 1];
        if (Math.abs(prev.x - next.x) < EPS && Math.abs(prev.y - next.y) < EPS) {
          offenders.push({ edgeId: edge.id ?? '<unnamed>', kind: 'spike' });
          continue;
        }
        const sameX = Math.abs(prev.x - cur.x) < EPS && Math.abs(cur.x - next.x) < EPS;
        const sameY = Math.abs(prev.y - cur.y) < EPS && Math.abs(cur.y - next.y) < EPS;
        if (sameX) {
          const lo = Math.min(prev.y, next.y);
          const hi = Math.max(prev.y, next.y);
          if (cur.y > lo + EPS && cur.y < hi - EPS) {
            offenders.push({ edgeId: edge.id ?? '<unnamed>', kind: 'collinear' });
          }
        } else if (sameY) {
          const lo = Math.min(prev.x, next.x);
          const hi = Math.max(prev.x, next.x);
          if (cur.x > lo + EPS && cur.x < hi - EPS) {
            offenders.push({ edgeId: edge.id ?? '<unnamed>', kind: 'collinear' });
          }
        }
      }
      // Zero-progress-out-and-back check (first and last point match).
      if (pts.length >= 3 && hasZeroProgressOutAndBack(pts)) {
        offenders.push({ edgeId: edge.id ?? '<unnamed>', kind: 'zeroProgress' });
      }
    }
    if (offenders.length > 0) {
      console.log('[SWIMLANE_HOE] polyline offenders:', JSON.stringify(offenders, null, 2));
    }
    expect(offenders).toEqual([]);
  });

  it('Level 2: validateLayout — no crossings on the HoE fixture', () => {
    // Crossings are a hard invariant under Strategy 1 (paper-backed
    // §118 preserves routing topology). The HoE fixture has no
    // natural crossings given its rank/lane structure.
    const { layout } = runHoESwimlanesLR();
    const { breakdown } = validateLayout(layout);
    expect(breakdown.crossings).toBe(0);
  });
});
