import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { anchorLabelsToPolyline } from '../direction/labelAnchoring.js';
import type * as LabelAnchoring from '../direction/labelAnchoring.js';
import { approachBordersSquarely } from '../direction/endpointClip.js';
import type * as EndpointClip from '../direction/endpointClip.js';
import { postProcessSwimlaneLayout } from '../postProcessing.js';

vi.mock('../direction/labelAnchoring.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LabelAnchoring>();
  return { ...actual, anchorLabelsToPolyline: vi.fn(actual.anchorLabelsToPolyline) };
});

vi.mock('../direction/endpointClip.js', async (importOriginal) => {
  const actual = await importOriginal<typeof EndpointClip>();
  return { ...actual, approachBordersSquarely: vi.fn(actual.approachBordersSquarely) };
});

/** A labelled edge `A --> B` that bends once, between two nodes of one lane. */
function labelledEdgeLayout(endpointProfile?: 'flat'): LayoutData {
  const metadata = endpointProfile ? { metadata: { endpointProfile } } : {};
  return {
    nodes: [
      { id: 'lane', x: 50, y: 50, width: 220, height: 180, isGroup: true },
      { id: 'A', x: 0, y: 0, width: 40, height: 40, isGroup: false, ...metadata },
      { id: 'B', x: 100, y: 100, width: 40, height: 40, isGroup: false },
      {
        id: 'edge-label-A-B',
        x: 0,
        y: 0,
        width: 70,
        height: 10,
        isGroup: false,
        isEdgeLabel: true,
      },
    ],
    edges: [
      {
        id: 'A_B',
        start: 'A',
        end: 'B',
        type: 'arrow',
        labelNodeId: 'edge-label-A-B',
        points: [
          { x: 20, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 100 },
          { x: 80, y: 100 },
        ],
      },
    ],
    config: {},
  };
}

/** Whether the labels are anchored to the routes again after the last pass that reshapes them. */
function anchorsLabelsAfterTheLastRoutePass(layout: LayoutData): boolean {
  postProcessSwimlaneLayout(layout, 'TB');
  const lastAnchoring = Math.max(...vi.mocked(anchorLabelsToPolyline).mock.invocationCallOrder);
  const lastRoutePass = Math.max(...vi.mocked(approachBordersSquarely).mock.invocationCallOrder);
  return lastAnchoring > lastRoutePass;
}

describe('label anchoring at the end of the swimlane post-processing', () => {
  beforeEach(() => {
    vi.mocked(anchorLabelsToPolyline).mockClear();
    vi.mocked(approachBordersSquarely).mockClear();
  });

  it('leaves the labels where the earlier passes put them when no node declares an endpoint profile', () => {
    expect(anchorsLabelsAfterTheLastRoutePass(labelledEdgeLayout())).toBe(false);
  });

  it('anchors the labels to the final routes when a node declares an endpoint profile', () => {
    expect(anchorsLabelsAfterTheLastRoutePass(labelledEdgeLayout('flat'))).toBe(true);
  });
});
