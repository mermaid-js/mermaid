import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

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
  test('should keep thick link caps within the space between nodes', async ({ page }, testInfo) => {
    const nodeWidth = 10;

    await renderGraph(
      page,
      testInfo,
      `sankey-beta
      Sent,Delivered,109366
      Delivered,Opened,44589
      Opened,Clicked,338
      Opened,Unsubscribed,246
      Clicked,Registered,200
      Clicked,Donated,1
      Sent,Bounced,6641
      Bounced,Delivered,0
      `,
      { screenshot: false, sankey: { nodeWidth, showValues: true } }
    );

    const measurements = await page.locator('.link path').evaluateAll((elements, nodeWidth) => {
      const links = elements as SVGPathElement[];
      const [targetLink, sourceLink] = links;
      if (!targetLink || !sourceLink) {
        throw new Error('Expected at least two rendered Sankey links');
      }

      const isHit = (link: SVGPathElement, point: DOMPoint): boolean => {
        // Live Editor's Rough mode applies round caps while transforming the SVG.
        link.style.strokeLinecap = 'round';
        link.style.pointerEvents = 'stroke';

        const screenTransform = link.getScreenCTM();
        if (!screenTransform) {
          throw new Error('Expected the rendered Sankey link to have a screen transform');
        }

        const screenPoint = point.matrixTransform(screenTransform);
        return link.ownerDocument.elementsFromPoint(screenPoint.x, screenPoint.y).includes(link);
      };

      const targetLength = targetLink.getTotalLength();
      const target = targetLink.getPointAtLength(targetLength);
      const targetStrokeWidth = Number.parseFloat(getComputedStyle(targetLink).strokeWidth);

      const source = sourceLink.getPointAtLength(0);
      const sourceStrokeWidth = Number.parseFloat(getComputedStyle(sourceLink).strokeWidth);

      return {
        targetStrokeWidth,
        targetInsideHit: isHit(targetLink, targetLink.getPointAtLength(targetLength - 1)),
        targetOutsideHit: isHit(targetLink, new DOMPoint(target.x + nodeWidth + 2, target.y)),
        sourceStrokeWidth,
        sourceInsideHit: isHit(sourceLink, sourceLink.getPointAtLength(1)),
        sourceOutsideHit: isHit(sourceLink, new DOMPoint(source.x - nodeWidth - 2, source.y)),
      };
    }, nodeWidth);

    expect(measurements.targetStrokeWidth / 2).toBeGreaterThan(nodeWidth + 2);
    expect(measurements.targetInsideHit).toBe(true);
    expect(measurements.targetOutsideHit).toBe(false);
    expect(measurements.sourceStrokeWidth / 2).toBeGreaterThan(nodeWidth + 2);
    expect(measurements.sourceInsideHit).toBe(true);
    expect(measurements.sourceOutsideHit).toBe(false);
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
});
