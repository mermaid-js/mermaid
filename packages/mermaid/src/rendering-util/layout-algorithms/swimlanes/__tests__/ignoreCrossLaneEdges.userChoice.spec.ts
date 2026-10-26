import { afterEach, describe, expect, it } from 'vitest';
import { addDirective, getConfig, reset } from '../../../../config.js';
import { db } from '../../../../diagrams/bpmn/bpmnDb.js';
import type { LayoutData, Node } from '../../../types.js';
import { prepareSwimlaneLayout } from '../index.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

type Choice = 'unset' | boolean;

const lane = (id: string): Node => ({ id, isGroup: true, padding: 20 }) as Node;
const box = (id: string, parentId: string): Node =>
  ({ id, isGroup: false, width: 100, height: 50, parentId }) as Node;

/** What swimlane-beta hands the layout: the merged config, the schema default unless chosen. */
function swimlaneBeta(): LayoutData {
  return {
    nodes: [lane('L1'), lane('L2'), box('a', 'L1'), box('b', 'L2'), box('c', 'L1')],
    edges: [
      { id: 'eAB', start: 'a', end: 'b', type: 'normal' },
      { id: 'eBC', start: 'b', end: 'c', type: 'normal' },
    ],
    config: {
      flowchart: { nodeSpacing: 40, rankSpacing: 80 },
      swimlane: getConfig().swimlane,
    },
    direction: 'TB',
  } as unknown as LayoutData;
}

/** What bpmn-beta hands the layout: its db's own data, with the global config as it stands. */
function bpmnBeta(): LayoutData {
  db.clear();
  db.parse(
    'bpmn-beta TB\n  lane "A"\n    task a "A"\n    task c "C"\n  lane "B"\n    task b "B"\n  a --> b\n  b --> c\n'
  );
  const layout = db.getData();
  for (const node of layout.nodes) {
    if (!node.isGroup) {
      node.width = 100;
      node.height = 50;
    }
  }
  return layout;
}

function rowsAfterRender(build: () => LayoutData, choice: Choice): number {
  reset();
  if (choice !== 'unset') {
    addDirective({ swimlane: { ignoreCrossLaneEdges: choice } });
  }
  const layout = build();
  prepareSwimlaneLayout(layout);
  runSwimlaneLayoutCore(layout);
  return new Set(layout.nodes.filter((node) => !node.isGroup).map((node) => node.y)).size;
}

describe('an explicit ignoreCrossLaneEdges reaches the swimlane engine', () => {
  afterEach(() => reset());

  it.each([
    ['unset', 2],
    [true, 2],
    [false, 3],
  ] as const)('swimlane-beta, %s: %i rows', (choice, rows) => {
    expect(rowsAfterRender(swimlaneBeta, choice)).toBe(rows);
  });

  it.each([
    ['unset', 3],
    [true, 2],
    [false, 3],
  ] as const)('bpmn-beta, %s: %i rows', (choice, rows) => {
    expect(rowsAfterRender(bpmnBeta, choice)).toBe(rows);
  });
});
