import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

test.describe('Graph', () => {
  test('38: should render a flowchart when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
    const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
    // `useMaxWidth` sets max-width to the diagram's own width, so assert it against the
    // viewBox rather than a hardcoded pixel figure. The natural width depends on the
    // default look, theme and font -- none of which this test is about -- so an absolute
    // expectation breaks whenever any of those change.
    const viewBox = (await svg.getAttribute('viewBox')) ?? '';
    const viewBoxWidth = parseFloat(viewBox.split(/\s+/)[2]);
    expect(viewBoxWidth).toBeGreaterThan(0);
    expect(maxWidthValue).toBeCloseTo(viewBoxWidth, 1);
  });
  test('39: should render a flowchart when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `graph TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    // Same reasoning as the useMaxWidth:true case: the width attribute carries the
    // diagram's own width, which the viewBox already states.
    const viewBox = (await svg.getAttribute('viewBox')) ?? '';
    const viewBoxWidth = parseFloat(viewBox.split(/\s+/)[2]);
    expect(viewBoxWidth).toBeGreaterThan(0);
    expect(width).toBeCloseTo(viewBoxWidth, 1);
    await expect(svg).not.toHaveAttribute('style');
  });
  test('40: should add edge animation', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
      flowchart TD
          A(["Start"]) L_A_B_0@--> B{"Decision"}
          B --> C["Option A"] & D["Option B"]
          style C stroke-width:4px,stroke-dasharray: 5
          L_A_B_0@{ animation: slow }
          L_B_D_0@{ animation: fast }`,
      { screenshot: false }
    );
    // Verify animation classes are applied to both edges
    await expect(page.locator('path[id$="-L_A_B_0"]')).toHaveClass(/edge-animation-slow/);
    await expect(page.locator('path[id$="-L_B_D_0"]')).toHaveClass(/edge-animation-fast/);
  });

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
