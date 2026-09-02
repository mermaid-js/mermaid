import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('Flowchart Dagre', () => {
  test('1-dagre: should render a simple flowchart', async ({ page }, testInfo) => {
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
      { flowchart: { defaultRenderer: 'dagre' } }
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
      { flowchart: { defaultRenderer: 'dagre' } }
    );
  });

  test('7-dagre: should render a flowchart when useMaxWidth is true (default)', async ({
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
      { flowchart: { useMaxWidth: true, defaultRenderer: 'dagre' } }
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
  test('8-dagre: should render a flowchart when useMaxWidth is false', async ({
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
      { flowchart: { useMaxWidth: false, defaultRenderer: 'dagre' } }
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

  test('dagre: should include classes on the edges', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart TD
      A --> B --> C --> D
      `,
      { flowchart: { defaultRenderer: 'dagre' } }
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
      { flowchart: { defaultRenderer: 'dagre' } }
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
      { flowchart: { defaultRenderer: 'dagre' } }
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
