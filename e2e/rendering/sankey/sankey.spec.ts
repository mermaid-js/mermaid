import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

const linkColorGraph = `sankey
      a,b,10
      `;

const nodeAlignmentGraph = `
        sankey
        
        a,b,8
        b,c,8
        c,d,8
        d,e,8
        
        x,c,4
        c,y,4  
        `;

const labelStyleGraph = `sankey
        a,b,10
        b,c,10
        `;

const nodeColorsGraph = `sankey
        a,b,10
        b,c,20
        `;

const assertNodeX = async (page, nodeId, expectedX) => {
  const x = await page.locator(`.node[id="${nodeId}"]`).getAttribute('x');
  expect(x).toBe(String(expectedX));
};

test.describe('Sankey Diagram', () => {
  test('should render a simple example', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      sankey-beta
      
      sourceNode,targetNode,10
      `,
      {}
    );
  });

  test.describe('when given a linkColor', () => {
    test('links should use hex color', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, linkColorGraph, { sankey: { linkColor: '#636465' } });

      const stroke = await page.locator('.link path').getAttribute('stroke');
      expect(stroke).toBe('#636465');
    });

    test('links should be the same color as source node', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, linkColorGraph, { sankey: { linkColor: 'source' } });

      const linkStroke = await page.locator('.link path').getAttribute('stroke');
      const nodeFill = await page.locator('.node[id="node-1"] rect').getAttribute('fill');
      expect(linkStroke).toBe(nodeFill);
    });

    test('links should be the same color as target node', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, linkColorGraph, { sankey: { linkColor: 'target' } });

      const linkStroke = await page.locator('.link path').getAttribute('stroke');
      const nodeFill = await page.locator('.node[id="node-2"] rect').getAttribute('fill');
      expect(linkStroke).toBe(nodeFill);
    });

    test('links must be gradient', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, linkColorGraph, { sankey: { linkColor: 'gradient' } });

      const stroke = await page.locator('.link path').getAttribute('stroke');
      expect(stroke).toBe('url(#linearGradient-3)');
    });
  });

  test.describe('when given a nodeAlignment', () => {
    const assertMainNodes = async (page) => {
      await assertNodeX(page, 'node-1', 0);
      await assertNodeX(page, 'node-2', 100);
      await assertNodeX(page, 'node-3', 200);
      await assertNodeX(page, 'node-4', 300);
      await assertNodeX(page, 'node-5', 400);
    };

    test('should justify nodes', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeAlignmentGraph, {
        sankey: { nodeAlignment: 'justify', width: 410, useMaxWidth: false },
      });
      await assertMainNodes(page);
      await assertNodeX(page, 'node-6', 0);
      await assertNodeX(page, 'node-7', 400);
    });

    test('should align nodes left', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeAlignmentGraph, {
        sankey: { nodeAlignment: 'left', width: 410, useMaxWidth: false },
      });
      await assertMainNodes(page);
      await assertNodeX(page, 'node-6', 0);
      await assertNodeX(page, 'node-7', 300);
    });

    test('should align nodes right', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeAlignmentGraph, {
        sankey: { nodeAlignment: 'right', width: 410, useMaxWidth: false },
      });
      await assertMainNodes(page);
      await assertNodeX(page, 'node-6', 100);
      await assertNodeX(page, 'node-7', 400);
    });

    test('should center nodes', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeAlignmentGraph, {
        sankey: { nodeAlignment: 'center', width: 410, useMaxWidth: false },
      });
      await assertMainNodes(page);
      await assertNodeX(page, 'node-6', 100);
      await assertNodeX(page, 'node-7', 300);
    });
  });

  test.describe('when given a labelStyle', () => {
    test('should render with legacy style by default', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, labelStyleGraph, { sankey: {} });

      // Default (legacy) style should not have the outlined label classes
      await expect(page.locator('.node-labels .sankey-label-bg')).toHaveCount(0);
      await expect(page.locator('.node-labels .sankey-label-fg')).toHaveCount(0);
      await expect(page.locator('.node-labels text')).toHaveCount(3);
    });

    test('should render legacy (plain) labels when labelStyle is legacy', async ({
      page,
    }, testInfo) => {
      await renderGraph(page, testInfo, labelStyleGraph, { sankey: { labelStyle: 'legacy' } });

      // Legacy style should not have the outlined label classes
      await expect(page.locator('.node-labels .sankey-label-bg')).toHaveCount(0);
      await expect(page.locator('.node-labels .sankey-label-fg')).toHaveCount(0);
      await expect(page.locator('.node-labels text')).toHaveCount(3);
    });

    test('should render outlined labels when labelStyle is outlined', async ({
      page,
    }, testInfo) => {
      await renderGraph(page, testInfo, labelStyleGraph, { sankey: { labelStyle: 'outlined' } });

      await expect(page.locator('.node-labels .sankey-label-bg')).toHaveCount(3);
      await expect(page.locator('.node-labels .sankey-label-fg')).toHaveCount(3);
    });
  });

  test.describe('when given nodeWidth and nodePadding', () => {
    test('should respect custom nodeWidth', async ({ page }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `sankey
        a,b,10
        `,
        { sankey: { nodeWidth: 20, useMaxWidth: false } }
      );

      const width = parseFloat(
        (await page.locator('.node rect').first().getAttribute('width')) ?? '0'
      );
      expect(width).toBe(20);
    });

    test('should use default nodeWidth of 10', async ({ page }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `sankey
        a,b,10
        `,
        { sankey: { useMaxWidth: false } }
      );

      const width = parseFloat(
        (await page.locator('.node rect').first().getAttribute('width')) ?? '0'
      );
      expect(width).toBe(10);
    });
  });

  test.describe('smart label positioning', function () {
    test('should render labels with Apple-style outlined text', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sankey

        iPhone,Products,205
        Mac,Products,40
        iPad,Products,29
        Wearables,Products,41
        Products,Revenue,315
        Services,Revenue,78
        Revenue,Cost of Revenue,223
        Revenue,Gross Profit,170
        Gross Profit,Op Expenses,51
        Gross Profit,Op Profit,119
        Op Profit,Tax,19
        Op Profit,Net Profit,100
        `,
        { sankey: { width: 800, height: 500, labelStyle: 'outlined' } }
      );
    });
  });

  test.describe('when given nodeColors', () => {
    test('should apply custom node colors', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeColorsGraph, {
        sankey: { nodeColors: { a: '#ff0000', b: '#00ff00' } },
      });

      const fill = await page.locator('.node').first().locator('rect').getAttribute('fill');
      expect(fill).toBe('#ff0000');
    });

    test('should fall back to default colors for unspecified nodes', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeColorsGraph, {
        sankey: { nodeColors: { a: '#ff0000' } },
      });

      const firstFill = await page.locator('.node').first().locator('rect').getAttribute('fill');
      expect(firstFill).toBe('#ff0000');

      const secondFill = await page.locator('.node').nth(1).locator('rect').getAttribute('fill');
      expect(secondFill).not.toBe('#ff0000');
    });
  });

  test.describe('Apple-style financial flow demo', function () {
    test('should render complete financial flow with custom colors', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sankey

        iPhone,Products,205
        Mac,Products,40
        iPad,Products,29
        Wearables,Products,41
        Products,Revenue,315
        Services,Revenue,78
        Revenue,Cost of Revenue,223
        Revenue,Gross Profit,170
        Gross Profit,Op Expenses,51
        Gross Profit,Op Profit,119
        Op Profit,Tax,19
        Op Profit,Net Profit,100
        `,
        {
          sankey: {
            width: 800,
            height: 500,
            labelStyle: 'outlined',
            showValues: true,
            prefix: '$',
            suffix: 'B',
            nodeColors: {
              iPhone: '#6e6e73',
              Mac: '#6e6e73',
              iPad: '#6e6e73',
              Wearables: '#6e6e73',
              Products: '#6e6e73',
              Services: '#6e6e73',
              Revenue: '#424245',
              'Cost of Revenue': '#ff3b30',
              'Gross Profit': '#34c759',
              'Op Expenses': '#ff3b30',
              'Op Profit': '#34c759',
              Tax: '#ff3b30',
              'Net Profit': '#34c759',
            },
          },
        }
      );
    });
  });
});
