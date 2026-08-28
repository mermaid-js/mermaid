import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph, verifyNumber } from '../../helpers/util.ts';

test.describe('Flowchart ELK', () => {
  test('1-elk: should render a simple flowchart', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart-elk TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      {}
    );
    await imgSnapshotTest(
      page,
      testInfo,
      `flowchart TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { defaultRenderer: 'elk' } }
    );
  });

  test('7-elk: should render a flowchart when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart-elk TD
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
    verifyNumber(maxWidthValue, 380, 15);
  });
  test('8-elk: should render a flowchart when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart-elk TD
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
    verifyNumber(width, 380, 15);
    await expect(svg).not.toHaveAttribute('style');
  });

  test('elk: should include classes on the edges', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart-elk TD
      A --> B --> C --> D
      `,
      {}
    );
    await page.locator('svg').evaluate((svg) => {
      const edges = svg.querySelectorAll('.edges > path');
      for (const edge of edges) {
        if (!edge.classList.contains('flowchart-link')) {
          throw new Error('Expected flowchart-link class on edge');
        }
      }
    });
  });
});

test.describe('Title and arrow styling #4813', () => {
  test('should render a flowchart with title', async ({ page }, testInfo) => {
    const titleString = 'Test Title';
    await renderGraph(
      page,
      testInfo,
      `---
      title: ${titleString}
      ---
      flowchart LR
      A-->B
      A-->C`,
      { layout: 'elk' }
    );
    const titleText = await page.locator('svg text').first().textContent();
    expect(titleText).toContain(titleString);
  });

  test('Render with stylized arrows', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
      flowchart LR
      A-->B
      B-.-oC
      C==xD
      D ~~~ A`,
      { layout: 'elk' }
    );
    await page.locator('svg').evaluate((svg) => {
      const edges = svg.querySelectorAll('.edges path');
      const classes = [
        'edge-pattern-solid',
        'edge-pattern-dotted',
        'edge-thickness-thick',
        'edge-thickness-invisible',
      ];
      classes.forEach((className, index) => {
        const classAttr = edges[index].getAttribute('class') ?? '';
        if (!classAttr.includes(className)) {
          throw new Error(`Expected class ${className} on edge ${index}`);
        }
      });
    });
  });
});
