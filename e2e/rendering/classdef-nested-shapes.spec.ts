import { expect, test } from '@playwright/test';
import { diagramSvg, renderGraph } from '../helpers/util.ts';

const graph = `flowchart LR
  A[Rectangle]:::paint
  B([Stadium]):::paint
  C@{ shape: flag, label: "Flag" }
  D(((Double circle))):::paint
  E@{ shape: stadium, label: "New stadium" }
  class C,E paint
  classDef paint fill:#ff0000,stroke:#0000ff,color:#008000
`;

test.describe('classDef colors for nested flowchart shapes', () => {
  for (const look of ['classic', 'neo'] as const) {
    for (const htmlLabels of [true, false]) {
      for (const stripStyles of [false, true]) {
        test(`${look}, htmlLabels=${htmlLabels}, stripped styles=${stripStyles}`, async ({
          page,
        }, testInfo) => {
          await renderGraph(page, testInfo, graph, { look, htmlLabels, screenshot: false });
          const svg = diagramSvg(page);
          if (stripStyles) {
            await svg.locator('[style]').evaluateAll((elements) => {
              elements.forEach((element) => element.removeAttribute('style'));
            });
          }

          const nodes = svg.locator('.node.paint');
          await expect(nodes).toHaveCount(5);
          for (const node of await nodes.all()) {
            const shapes = await node.evaluate((element) =>
              [
                ...element.querySelectorAll(
                  ':scope > rect, :scope > polygon, :scope > path, :scope > circle, :scope > g > path, :scope > g > circle'
                ),
              ].map((shape) => {
                const style = getComputedStyle(shape);
                return { fill: style.fill, stroke: style.stroke };
              })
            );
            expect(shapes.length).toBeGreaterThan(0);
            for (const shape of shapes) {
              expect(shape).toEqual({ fill: 'rgb(255, 0, 0)', stroke: 'rgb(0, 0, 255)' });
            }
            const label = node.locator(htmlLabels ? '.nodeLabel' : 'tspan').first();
            await expect(label).toHaveCSS(htmlLabels ? 'color' : 'fill', 'rgb(0, 128, 0)');
          }
        });
      }
    }
  }

  for (const stripStyles of [false, true]) {
    test(`handDrawn outlines keep fill none, stripped styles=${stripStyles}`, async ({
      page,
    }, testInfo) => {
      const handDrawnGraph = graph;
      await renderGraph(page, testInfo, handDrawnGraph, {
        look: 'handDrawn',
        htmlLabels: true,
        screenshot: false,
      });
      const svg = diagramSvg(page);
      if (stripStyles) {
        await svg.locator('[style]').evaluateAll((elements) => {
          elements.forEach((element) => element.removeAttribute('style'));
        });
      }

      // Double-circle repeats the user class on an inner group. Rules must exclude
      // the whole rough-node subtree.
      const nodes = svg.locator('.rough-node.paint');
      await expect(nodes).toHaveCount(5);
      for (const node of await nodes.all()) {
        const outlines = node.locator('path[fill="none"]');
        expect(await outlines.count()).toBeGreaterThan(0);
        for (const outline of await outlines.all()) {
          await expect(outline).toHaveCSS('fill', 'none');
        }
        await expect(node.locator('.nodeLabel').first()).toHaveCSS('color', 'rgb(0, 128, 0)');
      }
    });
  }
});
