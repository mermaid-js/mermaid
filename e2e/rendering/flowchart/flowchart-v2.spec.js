import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('Flowchart v2', () => {
  test('7: should render a flowchart when useMaxWidth is true (default)', async ({
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
    expect(maxWidthValue).toBeGreaterThanOrEqual(440 * 0.95);
    expect(maxWidthValue).toBeLessThanOrEqual(440 * 1.05);
  });
  test('8: should render a flowchart when useMaxWidth is false', async ({ page }, testInfo) => {
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
      { flowchart: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThanOrEqual(440 * 0.95);
    expect(width).toBeLessThanOrEqual(440 * 1.05);
    await expect(svg).not.toHaveAttribute('style');
  });

  test.describe('when rendering unsupported markdown', () => {
    const graph = `flowchart TB
    mermaid{"What is\nyourmermaid version?"} --> v10["<11"] --"\`<**1**1\`"--> fine["No bug"]
    mermaid --> v11[">= v11"] -- ">= v11" --> broken["Affected by https://github.com/mermaid-js/mermaid/issues/5824"]
    subgraph subgraph1["\`How to fix **fix**\`"]
        broken --> B["B"]
    end
    githost["Github, Gitlab, BitBucket, etc."]
    githost2["\`Github, Gitlab, BitBucket, etc.\`"]
    a["\`1.\`"]
    b["\`- x\`"]
      `;

    test('should render raw strings', async ({ page }, testInfo) => {
      await imgSnapshotTest(page, testInfo, graph);
    });

    test('should render raw strings with htmlLabels: false', async ({ page }, testInfo) => {
      await imgSnapshotTest(page, testInfo, graph, { htmlLabels: false });
    });
  });

  test.describe('Edge label autowrapping', () => {
    test('should wrap edge labels', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        [
          {
            markdownAutoWrap: true,
            htmlLabels: true,
          },
          { markdownAutoWrap: true, htmlLabels: false },
          { markdownAutoWrap: false, htmlLabels: true },
          // TODO: currently broken
          // {markdownAutoWrap: false, htmlLabels: false},
        ].map(
          ({ markdownAutoWrap, htmlLabels }) => `---
config: ${JSON.stringify({ markdownAutoWrap, htmlLabels })}
title: Testing with ${JSON.stringify({ markdownAutoWrap, htmlLabels })}
---
flowchart TD
    A["This is a really long line of plain text that will autowrap and support \\n newlines too."]
    B["\`This is a really long line of **markdown** text that will autowrap, unless markdownAutoWrap:false is set.\`"]
    A -- "Plain text **labels** in flowcharts will autowrap,like node labels. \\n Newline characters work too." --> B
    B -- "\`**Markdown** edge labels will autowrap, unless markdownAutoWrap: false is set\`" --> C
`
        )
      );
    });
  });
});
