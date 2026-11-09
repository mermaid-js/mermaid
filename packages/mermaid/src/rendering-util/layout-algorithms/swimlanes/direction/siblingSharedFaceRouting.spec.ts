import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '../../../types.js';
import { EDGE_ROUTING } from '../config.js';
import { straightenCollinearSiblingDetours } from './siblingSharedFaceRouting.js';

const COLUMN_X = 100;
const UPPER_Y = 0;
const LOWER_Y = 150;
const MIDDLE_Y = (UPPER_Y + LOWER_Y) / 2;
const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;
/** How far the detour of the back edge runs outside the nodes' right faces. */
const DETOUR_OFFSET = 20;
/** Where a third node sits, to the right of the column, for an edge that fans out to it. */
const SIDE_NODE_X = 300;
/** Shift of a rescued line beside an edge to a different node (`PORT_SHIFT`). */
const PORT_SHIFT = 4;
/** Room between a label and the rescued line beside it (`LABEL_CLEARANCE_BUFFER`). */
const LABEL_CLEARANCE_BUFFER = 3;
/** Wider than the arrowhead spacing, so the label decides the shift. */
const WIDE_LABEL = { width: 60, height: 20 };
/** Narrower than two arrowhead spacings, so no shifted line fits on its face. */
const NARROW_NODE_WIDTH = EDGE_ROUTING.MIN_ARROWHEAD_SPACING * 2 - 1;
/** A column for which `(x + 12) - x` evaluates just below 12 in floating point. */
const DRIFTING_COLUMN_X = 127.33749827435226;

function box(id: string, x: number, y: number, width = NODE_WIDTH): Node {
  return { id, isGroup: false, x, y, width, height: NODE_HEIGHT };
}

function edgeLabel(id: string, x: number, size: { width: number; height: number }): Node {
  return { id, isGroup: false, isEdgeLabel: true, x, y: MIDDLE_Y, ...size };
}

interface PairOptions {
  columnX?: number;
  nodeWidth?: number;
  backLabel?: { width: number; height: number };
}

/**
 * Two nodes in one column: `assess` above `reply`, joined by a straight edge down the
 * middle and a back edge that the router sent round a U-detour on the right.
 */
function oppositePair({ columnX = COLUMN_X, nodeWidth = NODE_WIDTH, backLabel }: PairOptions = {}) {
  const halfHeight = NODE_HEIGHT / 2;
  const nodes = [
    box('assess', columnX, UPPER_Y, nodeWidth),
    box('reply', columnX, LOWER_Y, nodeWidth),
    ...(backLabel ? [edgeLabel('label-back', columnX, backLabel)] : []),
  ];
  const down: Edge = {
    id: 'down',
    start: 'assess',
    end: 'reply',
    points: [
      { x: columnX, y: UPPER_Y + halfHeight },
      { x: columnX, y: LOWER_Y - halfHeight },
    ],
  };
  const right = columnX + nodeWidth / 2;
  const back: Edge = {
    id: 'back',
    start: 'reply',
    end: 'assess',
    ...(backLabel ? { labelNodeId: 'label-back' } : {}),
    points: [
      { x: right, y: LOWER_Y },
      { x: right + DETOUR_OFFSET, y: LOWER_Y },
      { x: right + DETOUR_OFFSET, y: UPPER_Y },
      { x: right, y: UPPER_Y },
    ],
  };
  return { nodes, down, back };
}

const xsOf = (edge: Edge) => edge.points?.map(({ x }) => x);

describe('straightenCollinearSiblingDetours', () => {
  it('keeps a back edge one arrowhead spacing from the edge it runs beside', () => {
    const { nodes, down, back } = oppositePair();

    straightenCollinearSiblingDetours([down, back], nodes);

    const shiftedX = COLUMN_X + EDGE_ROUTING.MIN_ARROWHEAD_SPACING;
    expect(back.points).toEqual([
      { x: shiftedX, y: LOWER_Y - NODE_HEIGHT / 2 },
      { x: shiftedX, y: UPPER_Y + NODE_HEIGHT / 2 },
    ]);
    expect(xsOf(down)).toEqual([COLUMN_X, COLUMN_X]);
  });

  it('puts the back edge on the first side tried when the spacing drifts in floating point', () => {
    const { nodes, down, back } = oppositePair({ columnX: DRIFTING_COLUMN_X });

    straightenCollinearSiblingDetours([down, back], nodes);

    const shiftedX = DRIFTING_COLUMN_X + EDGE_ROUTING.MIN_ARROWHEAD_SPACING;
    expect(xsOf(back)).toEqual([shiftedX, shiftedX]);
  });

  it('straightens a lone detour onto the middle of the faces', () => {
    const { nodes, back } = oppositePair();

    straightenCollinearSiblingDetours([back], nodes);

    expect(xsOf(back)).toEqual([COLUMN_X, COLUMN_X]);
  });

  it('keeps the port shift beside an edge that leaves the face for a different node', () => {
    const { nodes, back } = oppositePair();
    const side = box('side', SIDE_NODE_X, MIDDLE_Y);
    const fanOut: Edge = {
      id: 'fan-out',
      start: 'assess',
      end: 'side',
      points: [
        { x: COLUMN_X, y: UPPER_Y + NODE_HEIGHT / 2 },
        { x: COLUMN_X, y: MIDDLE_Y },
        { x: SIDE_NODE_X - NODE_WIDTH / 2, y: MIDDLE_Y },
      ],
    };

    straightenCollinearSiblingDetours([fanOut, back], [...nodes, side]);

    expect(xsOf(back)).toEqual([COLUMN_X - PORT_SHIFT, COLUMN_X - PORT_SHIFT]);
  });

  it('shifts past a label wider than the arrowhead spacing by the label, not the spacing', () => {
    const { nodes, down, back } = oppositePair({ backLabel: WIDE_LABEL });

    straightenCollinearSiblingDetours([down, back], nodes);

    const labelShift = WIDE_LABEL.width / 2 + LABEL_CLEARANCE_BUFFER;
    expect(labelShift).toBeGreaterThan(EDGE_ROUTING.MIN_ARROWHEAD_SPACING);
    expect(xsOf(back)).toEqual([COLUMN_X + labelShift, COLUMN_X + labelShift]);
  });

  it('ignores the label of a layout-only edge between the same two nodes', () => {
    const { nodes, down, back } = oppositePair();
    const layoutOnly: Edge = {
      id: 'layout-only',
      start: 'reply',
      end: 'assess',
      isLayoutOnly: true,
      labelNodeId: 'label-layout-only',
    };

    straightenCollinearSiblingDetours(
      [down, back, layoutOnly],
      [...nodes, edgeLabel('label-layout-only', COLUMN_X, WIDE_LABEL)]
    );

    const shiftedX = COLUMN_X + EDGE_ROUTING.MIN_ARROWHEAD_SPACING;
    expect(xsOf(back)).toEqual([shiftedX, shiftedX]);
  });

  it('keeps the detour when the spacing does not fit on a narrow face', () => {
    const { nodes, down, back } = oppositePair({ nodeWidth: NARROW_NODE_WIDTH });
    const detour = structuredClone(back.points);
    expect(NARROW_NODE_WIDTH / 2).toBeGreaterThan(PORT_SHIFT);

    straightenCollinearSiblingDetours([down, back], nodes);

    expect(back.points).toEqual(detour);
  });
});
