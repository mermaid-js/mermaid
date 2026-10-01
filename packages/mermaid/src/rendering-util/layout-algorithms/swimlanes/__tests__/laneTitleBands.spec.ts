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

// A rail detouring around a lane has to stay out of the band that carries the lane's title.
describe('swimlane router: a detour and the lane title bands', () => {
  it.each([true, false])(
    'keeps the detour out of a lane title band (lanes carry the direction: %s)',
    (lanesKnowDirection) => {
      const data = layOutLR(
        [
          { id: 'HE_CA', lane: 'HoE', width: 110, height: 70 },
          { id: 'HE_Ans', lane: 'HoE', width: 90, height: 45 },
          { id: 'HE_Inv', lane: 'HoE', width: 110, height: 45 },
          { id: 'HE_Ans2', lane: 'HoE', width: 90, height: 45 },
          { id: 'A', lane: 'StatusSeeker', width: 110, height: 45 },
          { id: 'B', lane: 'StatusSeeker', width: 120, height: 70 },
          { id: 'TL_CA', lane: 'TechLead', width: 110, height: 70 },
          { id: 'TL_Ans', lane: 'TechLead', width: 90, height: 45 },
        ],
        [
          ['HE_CA', 'HE_Ans'],
          ['HE_CA', 'HE_Inv'],
          ['HE_Inv', 'HE_Ans2'],
          ['A', 'B'],
          ['TL_CA', 'TL_Ans'],
          ['B', 'TL_CA'],
          ['B', 'HE_CA'],
          ['TL_CA', 'HE_CA'],
        ],
        ['HoE', 'StatusSeeker', 'TechLead'],
        { nodeSpacing: 40, rankSpacing: 90, lanePadding: 20 },
        { lanesKnowDirection }
      );

      expect(issueTypes(data)).toEqual([]);
    }
  );
});
