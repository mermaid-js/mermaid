import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { anchorLabelsToPolyline } from '../direction/labelAnchoring.js';
import type * as LabelAnchoring from '../direction/labelAnchoring.js';
import { cropEdgeEndsToShapes } from '../direction/endpointClip.js';
import type * as EndpointClip from '../direction/endpointClip.js';
import { postProcessSwimlaneLayout } from '../postProcessing.js';

vi.mock('../direction/labelAnchoring.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LabelAnchoring>();
  return { ...actual, anchorLabelsToPolyline: vi.fn(actual.anchorLabelsToPolyline) };
});

vi.mock('../direction/endpointClip.js', async (importOriginal) => {
  const actual = await importOriginal<typeof EndpointClip>();
  return { ...actual, cropEdgeEndsToShapes: vi.fn(actual.cropEdgeEndsToShapes) };
});

/** A labelled edge `A --> B` in one lane, routed on `route`. */
function labelledEdgeLayout(route: { x: number; y: number }[]): LayoutData {
  return {
    nodes: [
      { id: 'lane', x: 50, y: 50, width: 220, height: 180, isGroup: true },
      { id: 'A', x: 0, y: 0, width: 40, height: 40, isGroup: false },
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
        points: route,
      },
    ],
    config: {},
  };
}

/** Whether the labels are anchored to the routes again after the edge ends are cropped. */
function anchorsLabelsAfterTheCrop(layout: LayoutData): boolean {
  postProcessSwimlaneLayout(layout, 'TB');
  const lastAnchoring = Math.max(...vi.mocked(anchorLabelsToPolyline).mock.invocationCallOrder);
  const crop = Math.max(...vi.mocked(cropEdgeEndsToShapes).mock.invocationCallOrder);
  return lastAnchoring > crop;
}

// B's box spans 80..120 on both axes.
const endsOnB = [
  { x: 20, y: 0 },
  { x: 50, y: 0 },
  { x: 50, y: 100 },
  { x: 80, y: 100 },
];
const runsThroughB = [
  { x: 20, y: 0 },
  { x: 50, y: 0 },
  { x: 50, y: 100 },
  { x: 110, y: 100 },
  { x: 110, y: 125 },
];

describe('label anchoring after the edge ends are cropped', () => {
  beforeEach(() => {
    vi.mocked(anchorLabelsToPolyline).mockClear();
    vi.mocked(cropEdgeEndsToShapes).mockClear();
  });

  it('leaves the labels where the earlier passes put them when no edge end is cropped', () => {
    expect(anchorsLabelsAfterTheCrop(labelledEdgeLayout(endsOnB))).toBe(false);
  });

  it('anchors the labels to the cropped routes when an edge end is cropped', () => {
    expect(anchorsLabelsAfterTheCrop(labelledEdgeLayout(runsThroughB))).toBe(true);
  });
});
