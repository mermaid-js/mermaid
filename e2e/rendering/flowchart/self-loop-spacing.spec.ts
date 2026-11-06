import { expect, test } from '@playwright/test';
import { renderGraph } from '../../helpers/util.js';

for (const direction of ['TB', 'BT', 'LR', 'RL']) {
  for (const external of [false, true]) {
    for (const loopCount of [1, 3]) {
      test(`self-loop spacing ${direction}, external connection ${external}, loops ${loopCount}`, async ({
        page,
      }, testInfo) => {
        const sizes = [];
        for (const rankSpacing of [25, 150]) {
          const pair = [];
          for (const loop of [false, true]) {
            await renderGraph(
              page,
              testInfo,
              `flowchart ${direction}
            subgraph outer[Outer]
              subgraph group[Group]
                direction ${direction}
                A[Node]
                ${loop ? Array.from({ length: loopCount }, (_, i) => `A -->|retry number ${i}| A`).join('\n') : ''}
              end
            end
            ${external ? 'A --> B[Neighbour]' : ''}`,
              { layout: 'dagre', flowchart: { rankSpacing, useMaxWidth: false }, screenshot: false }
            );
            const cluster = page
              .locator('.cluster')
              .filter({ has: page.locator(':scope > .cluster-label') });
            const bounds = await cluster.evaluateAll((elements) =>
              elements.map((element) => {
                const rect = element.querySelector(':scope > rect')!;
                return {
                  width: Number(rect.getAttribute('width')),
                  height: Number(rect.getAttribute('height')),
                };
              })
            );
            // Both the recursive and the externally connected cluster layout paths must
            // reserve the loop's geometry, independently of inter-rank spacing.
            pair.push(bounds.sort((a, b) => a.width * a.height - b.width * b.height)[0]);
            const paths = page.locator('.edgePaths path');
            await expect(paths).toHaveCount(Number(external) + (loop ? loopCount : 0));
            for (const path of await paths.all()) {
              expect(await path.getAttribute('d')).not.toMatch(/NaN|undefined/);
            }
            if (loop) {
              const group = await page
                .locator('.cluster > rect')
                .evaluateAll(
                  (rects) =>
                    rects
                      .map((rect) => rect.getBoundingClientRect().toJSON())
                      .sort((a, b) => a.width * a.height - b.width * b.height)[0]
                );
              for (let i = 0; i < loopCount; i++) {
                const path = await paths.nth(i).boundingBox();
                expect(path).not.toBeNull();
                expect(path!.x).toBeGreaterThanOrEqual(group.x - 1);
                expect(path!.y).toBeGreaterThanOrEqual(group.y - 1);
                expect(path!.x + path!.width).toBeLessThanOrEqual(group.right + 1);
                expect(path!.y + path!.height).toBeLessThanOrEqual(group.bottom + 1);
              }
              await page
                .locator('svg')
                .screenshot({ path: testInfo.outputPath(`loop-${rankSpacing}.png`) });
            }
          }
          sizes.push({
            width: pair[1].width - pair[0].width,
            height: pair[1].height - pair[0].height,
          });
        }
        expect(sizes[1].width).toBeCloseTo(sizes[0].width, 0);
        expect(sizes[1].height).toBeCloseTo(sizes[0].height, 0);
      });
    }
  }
}

for (const [name, code, labels, count] of [
  [
    'multiple diamond loops',
    'flowchart TB\n A{Decision} -->|first loop| A\n A -->|second loop with a longer label| A\n A --> B[Next]',
    ['first loop', 'second loop with a longer label'],
    3,
  ],
  ['state', 'stateDiagram-v2\n state Container {\n A --> A: retry\n }', ['retry'], 1],
  [
    'class multiplicities',
    'classDiagram\n Node "parent" --> "children" Node : contains',
    ['parent', 'children', 'contains'],
    1,
  ],
  ['entity relationship', 'erDiagram\n PERSON ||--o{ PERSON : supervises', ['supervises'], 1],
  [
    'compound loop',
    'flowchart TB\n subgraph group[Group]\n A[Node]\n end\n group -->|again| group',
    ['again'],
    1,
  ],
] as const) {
  test(`preserves ${name}`, async ({ page }, testInfo) => {
    await renderGraph(page, testInfo, code, { layout: 'dagre', screenshot: false });
    const paths = page.locator('.edgePaths path');
    await expect(paths).toHaveCount(count);
    for (const path of await paths.all()) {
      expect(await path.getAttribute('d')).toBeTruthy();
      expect(await path.getAttribute('d')).not.toMatch(/NaN|undefined/);
    }
    for (const label of labels) {
      await expect(page.locator('svg').getByText(label, { exact: true })).toBeVisible();
    }
    await page.locator('svg').screenshot({ path: testInfo.outputPath('diagram.png') });
  });
}

for (const direction of ['TB', 'BT', 'LR', 'RL']) {
  test(`long loop label with siblings ${direction}`, async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `flowchart ${direction}
      subgraph outer[Outer]
        subgraph inner[Inner]
          A[Node] -->|very long retry label| A
          A --> C[Sibling]
        end
      end
      A --> D[Outside]`,
      { layout: 'dagre', flowchart: { htmlLabels: false }, screenshot: false }
    );
    const group = await page
      .locator('.cluster > rect')
      .evaluateAll(
        (rects) =>
          rects
            .map((rect) => rect.getBoundingClientRect().toJSON())
            .sort((a, b) => a.width * a.height - b.width * b.height)[0]
      );
    await expect(page.locator('.edgePaths path')).toHaveCount(3);
    for (const element of [
      page.locator('.edgePaths path').first(),
      page.getByText('very long retry label', { exact: true }),
    ]) {
      const bounds = await element.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(group.x - 1);
      expect(bounds!.y).toBeGreaterThanOrEqual(group.y - 1);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(group.right + 1);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(group.bottom + 1);
    }
    await page.locator('svg').screenshot({ path: testInfo.outputPath('siblings.png') });
  });
}
