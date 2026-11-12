import { test, expect } from '@playwright/test';
import { renderGraph } from '../../../helpers/util.ts';

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
});
