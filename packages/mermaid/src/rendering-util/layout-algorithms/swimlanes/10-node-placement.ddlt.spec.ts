import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

const FIXTURE_ID = 'swimlanes/10-node-placement';
const FIXTURE_PATH = resolve(
  process.cwd(),
  'cypress/platform/dev-diagrams/layout-tests/swimlanes/10-node-placement.mmd'
);

async function runSwimlanes() {
  return await loadDdltFixture(FIXTURE_ID, { backendId: 'swimlanes' });
}

interface Point {
  x: number;
  y: number;
}
interface EdgeLike {
  id: string;
  points?: Point[];
}

function segmentsCross(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const eps = 1e-3;
  const aHorizontal = Math.abs(a1.y - a2.y) < eps;
  const aVertical = Math.abs(a1.x - a2.x) < eps;
  const bHorizontal = Math.abs(b1.y - b2.y) < eps;
  const bVertical = Math.abs(b1.x - b2.x) < eps;

  if (!((aHorizontal && bVertical) || (aVertical && bHorizontal))) {
    return false;
  }

  const horizontal = aHorizontal ? { a: a1, b: a2 } : { a: b1, b: b2 };
  const vertical = aVertical ? { a: a1, b: a2 } : { a: b1, b: b2 };
  const x = vertical.a.x;
  const y = horizontal.a.y;
  const hMin = Math.min(horizontal.a.x, horizontal.b.x);
  const hMax = Math.max(horizontal.a.x, horizontal.b.x);
  const vMin = Math.min(vertical.a.y, vertical.b.y);
  const vMax = Math.max(vertical.a.y, vertical.b.y);

  return x > hMin + eps && x < hMax - eps && y > vMin + eps && y < vMax - eps;
}

function edgesCross(a: EdgeLike | undefined, b: EdgeLike | undefined): boolean {
  const aPoints = a?.points ?? [];
  const bPoints = b?.points ?? [];
  for (let i = 0; i < aPoints.length - 1; i++) {
    for (let j = 0; j < bPoints.length - 1; j++) {
      if (segmentsCross(aPoints[i], aPoints[i + 1], bPoints[j], bPoints[j + 1])) {
        return true;
      }
    }
  }
  return false;
}

describe('Swimlanes DDLT — 10-node-placement.mmd', () => {
  it('Level 0: source fixture opts into the swimlane renderer', () => {
    const source = readFileSync(FIXTURE_PATH, 'utf8');

    expect(source).toMatch(/^\s*swimlane\b/m);
  });

  it('Level 1: validateLayout — produces a valid orthogonal layout', async () => {
    const layout = await runSwimlanes();
    const result = validateLayout(layout);

    if (!result.ok) {
      console.log('[10_NODE_PLACEMENT_DDLT] validateLayout issues:', result.issues);
    }

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('Level 1: D4 loopback enters D2 from the approach-side boundary', async () => {
    const layout = await runSwimlanes();
    const result = validateLayout(layout);
    const targetIntersections = result.issues.filter(
      (issue) =>
        issue.edgeId === 'L_D4_D2_0' &&
        Array.isArray(issue.nodeIds) &&
        issue.nodeIds.includes('D2') &&
        issue.type === 'edge-intersects-obstacle'
    );

    if (targetIntersections.length > 0) {
      console.log(
        '[10_NODE_PLACEMENT_DDLT] L_D4_D2_0 target intersections:',
        JSON.stringify(targetIntersections, null, 2)
      );
    }

    expect(targetIntersections).toEqual([]);
  });

  it('Level 2: validateLayout — keeps a high fixture score with no crossings', async () => {
    const layout = await runSwimlanes();
    const result = validateLayout(layout);

    expect(result.score).toBeGreaterThanOrEqual(995);
    expect(result.breakdown.crossings).toBe(0);
    expect(result.breakdown.totalBendPenalty).toBeLessThanOrEqual(5);
  });

  it('Level 3: keeps D4 terminal rails visually distinct', async () => {
    const layout = await runSwimlanes();
    const byId = new Map(layout.edges.map((edge) => [edge.id, edge]));
    const incoming = byId.get('L_D3_D4_0');
    const loopback = byId.get('L_D4_D2_0');

    expect(incoming?.points).toBeDefined();
    expect(loopback?.points).toBeDefined();

    const incomingD4Port = incoming!.points!.at(-1)!;
    const loopbackD4Port = loopback!.points![0];

    expect(
      Math.max(
        Math.abs(incomingD4Port.x - loopbackD4Port.x),
        Math.abs(incomingD4Port.y - loopbackD4Port.y)
      )
    ).toBeGreaterThanOrEqual(16);
  });

  it('Level 3: avoids the two rendered crossings visible in knsv3.html', async () => {
    const layout = await runSwimlanes();
    const byId = new Map(layout.edges.map((edge) => [edge.id, edge]));

    expect(edgesCross(byId.get('L_D4_D2_0'), byId.get('L_D2_D3_0'))).toBe(false);
    expect(edgesCross(byId.get('L_Te2_T4_0'), byId.get('L_T6_T5_0'))).toBe(false);
  });
});
