import { expect, test } from '@playwright/test';

import { renderGraph } from '../../../helpers/util.ts';

test.describe('Flowchart', () => {
  test('keeps ELK edge labels centered when subgraph title margins are set', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart LR
      subgraph subgraph1
        direction LR
        n1 -- my --- n2
      end`,
      {
        layout: 'elk',
        flowchart: {
          htmlLabels: false,
          subGraphTitleMargin: { top: 10, bottom: 10 },
        },
        screenshot: false,
      }
    );

    const edgeBox = await page.locator('.edgePaths path').boundingBox();
    const labelBox = await page.locator('.edgeLabel').boundingBox();
    expect(edgeBox).not.toBeNull();
    expect(labelBox).not.toBeNull();
    const labelCenterTolerance = 1;
    const edgeCenterY = edgeBox.y + edgeBox.height / 2;
    const labelCenterY = labelBox.y + labelBox.height / 2;
    expect(Math.abs(labelCenterY - edgeCenterY)).toBeLessThanOrEqual(labelCenterTolerance);
  });
});
