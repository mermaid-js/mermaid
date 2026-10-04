import { test } from '@playwright/test';
import { imgSnapshotTest, urlSnapshotTest } from '../../helpers/util.ts';

test.describe('architecture - fcose layout knobs', () => {
  // A linear chain demonstrates `idealEdgeLengthMultiplier` cleanly: bumping the multiplier
  // visibly stretches the gap between successive nodes. The 3-DB → MCP repro for #6120 is
  // not used here because that case is rooted in the BFS spatial-map collapsing siblings to
  // the same coordinate before fcose runs, which the knobs in this PR cannot escape; the
  // declarative `align row|column` directive (separate PR) is the actual fix for that.
  const chain = `architecture-beta
    service a(server)[A]
    service b(server)[B]
    service c(server)[C]
    a:R --> L:b
    b:R --> L:c
  `;

  test('should render with default fcose knobs', async ({ page }, testInfo) => {
    await imgSnapshotTest(page, testInfo, chain);
  });

  test('should render with an increased idealEdgeLengthMultiplier', async ({ page }, testInfo) => {
    await imgSnapshotTest(page, testInfo, chain, {
      architecture: { idealEdgeLengthMultiplier: 3 },
    });
  });
});

test.describe('architecture - external', () => {
  test('should allow adding external icons', async ({ page }, testInfo) => {
    await urlSnapshotTest(page, testInfo, '/architecture-external.html');
  });
});
