import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';
import { validateLayout } from '../../layout-utils/validateLayout.js';

interface NodeSpec {
  id: string;
  lane: string;
  width: number;
  height: number;
  shape?: string;
}

interface Spacing {
  nodeSpacing: number;
  rankSpacing: number;
  lanePadding: number;
}
// What a parsed flowchart-style swimlane diagram carries.
const PARSED: Spacing = { nodeSpacing: 50, rankSpacing: 50, lanePadding: 8 };

/** Lanes are listed last-declared first, as the parser emits them. */
function layOutLR(
  nodeSpecs: NodeSpec[],
  edges: [string, string][],
  lanes: string[],
  { nodeSpacing, rankSpacing, lanePadding }: Spacing = PARSED,
  { lanesKnowDirection = true } = {}
) {
  const nodes: LayoutData['nodes'] = [
    ...lanes.map((lane) => ({ id: lane, label: lane, isGroup: true, padding: lanePadding })),
    ...nodeSpecs.map(({ id, lane, width, height, shape }) => ({
      id,
      label: id,
      parentId: lane,
      isGroup: false,
      shape: shape ?? 'roundedRect',
      padding: 15,
      width,
      height,
    })),
  ];
  const data = {
    nodes,
    edges: edges.map(([start, end]) => ({
      id: `L_${start}_${end}_0`,
      start,
      end,
      type: 'arrow_point',
      arrowTypeEnd: 'arrow_point',
    })),
    direction: 'LR',
    config: { flowchart: { nodeSpacing, rankSpacing }, swimlane: {} },
    type: 'swimlane',
  } as unknown as LayoutData;
  prepareLayoutForSwimlanes(data);
  if (!lanesKnowDirection) {
    for (const node of data.nodes) {
      delete (node as { direction?: string }).direction;
    }
  }
  runSwimlaneLayoutCore(data);
  return data;
}

const issueTypes = (data: LayoutData) =>
  validateLayout(data).issues.map((issue) => `${issue.type}: ${issue.message}`);

// Two decisions sit on the same rank with a third lane between them, so the edge
// joining them has to detour around the middle lane's node.
describe('swimlane router: an edge within one rank that detours around another lane', () => {
  it('leaves the detour on a face point no other edge uses', () => {
    const diamond = { width: 142, height: 142, shape: 'diamond' };
    const data = layOutLR(
      [
        { id: 'A', lane: 'Seeker', width: 128, height: 45 },
        { id: 'A2', lane: 'Seeker', ...diamond },
        { id: 'E', lane: 'Head', ...diamond },
        { id: 'F', lane: 'Head', width: 79, height: 45 },
        { id: 'G', lane: 'Head', width: 100, height: 45 },
        { id: 'F2', lane: 'Head', width: 79, height: 45 },
        { id: 'B', lane: 'Lead', ...diamond },
        { id: 'C', lane: 'Lead', width: 79, height: 45 },
      ],
      [
        ['E', 'F'],
        ['E', 'G'],
        ['G', 'F2'],
        ['B', 'C'],
        ['A', 'A2'],
        ['A2', 'B'],
        ['A2', 'E'],
        ['B', 'E'],
      ],
      ['Lead', 'Head', 'Seeker']
    );

    expect(issueTypes(data)).toEqual([]);
  });
});
