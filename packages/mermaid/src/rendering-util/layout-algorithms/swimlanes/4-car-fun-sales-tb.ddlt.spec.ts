import { describe, expect, it } from 'vitest';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

describe('Swimlanes DDLT — 4-car-fun-sales-tb.mmd', () => {
  it('Level 1: validateLayout — produces a valid orthogonal layout', async () => {
    const layout = await loadDdltFixture('swimlanes/4-car-fun-sales-tb', {
      backendId: 'swimlanes',
    });
    const result = validateLayout(layout);

    if (!result.ok) {
      console.log(
        '[4_CAR_FUN_SALES_TB_DDLT] validateLayout issues:',
        JSON.stringify(result.issues, null, 2)
      );
    }

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('Level 1: L_I_K_0 exits I from a side port, not along the node border', async () => {
    const layout = await loadDdltFixture('swimlanes/4-car-fun-sales-tb', {
      backendId: 'swimlanes',
    });
    const result = validateLayout(layout);
    const sourceBorderIssues = result.issues.filter(
      (issue) =>
        issue.edgeId === 'L_I_K_0' &&
        Array.isArray(issue.nodeIds) &&
        issue.nodeIds.includes('I') &&
        (issue.type === 'edge-intersects-obstacle' ||
          issue.type === 'edge-corner-connection' ||
          issue.type === 'edge-border-hugging')
    );

    if (sourceBorderIssues.length > 0) {
      console.log(
        '[4_CAR_FUN_SALES_TB_DDLT] L_I_K_0 source border issues:',
        JSON.stringify(sourceBorderIssues, null, 2)
      );
    }

    expect(sourceBorderIssues).toEqual([]);
  });
});
