import { expect, test } from '@playwright/test';
import { pauseStepAnimationAt, visibleSteps } from '../../../helpers/stepAnimation';
import { imgSnapshotTest } from '../../../helpers/util';

const stepFlow = `flowchart LR
  Client e1@--> API
  API e2@--> DB
  DB e3@--> Client
  e1@{ step: 1 }
  e2@{ step: 2 }
  e3@{ step: 3 }`;

test.describe('flowchart step numbers', () => {
  test('should badge every step edge with its number', async ({ page }, testInfo) => {
    const options = { flowchart: { stepNumbers: true } };
    await imgSnapshotTest(page, testInfo, stepFlow, options, false, async (svg) => {
      await pauseStepAnimationAt(0)(svg);

      await expect(svg.locator('g.edge-step-badge text')).toHaveText(['1', '2', '3']);
      expect(await visibleSteps(svg, 'g.edge-step-badge')).toEqual(['1', '2', '3']);
    });
  });

  test('should keep badges clear of edge labels and of each other, above the dot', async ({
    page,
  }, testInfo) => {
    const labelled = `flowchart TD
  A e1@-- yes --> B
  B e2@-- no --> C
  A e3@--> C
  e1@{ step: 1 }
  e2@{ step: 2 }
  e3@{ step: 3 }`;
    const options = { flowchart: { stepNumbers: true } };
    await imgSnapshotTest(page, testInfo, labelled, options, false, async (svg) => {
      await pauseStepAnimationAt(0.5)(svg);

      const layout = await svg.evaluate((element: SVGSVGElement) => {
        const boxes = (query: string) =>
          [...element.querySelectorAll(query)]
            .map((node) => node.getBoundingClientRect())
            .filter((box) => box.width > 0);
        const overlaps = (a: DOMRect, b: DOMRect) =>
          a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const badges = boxes('g.edge-step-badge');
        const labels = boxes('g.edgeLabel .label');
        const dot = element.querySelector('circle.edge-step-dot[data-step="1"]');
        const badge = element.querySelector('g.edge-step-badge[data-step="1"]');
        return {
          badges: badges.length,
          labelHits: badges.filter((a) => labels.some((b) => overlaps(a, b))).length,
          badgeHits: badges.filter((a, i) => badges.some((b, j) => i !== j && overlaps(a, b)))
            .length,
          badgeAfterDot: !!(
            dot &&
            badge &&
            dot.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING
          ),
        };
      });

      expect(layout).toEqual({ badges: 3, labelHits: 0, badgeHits: 0, badgeAfterDot: true });
    });
  });

  test('should keep badges off every arrowhead and above every dot', async ({ page }, testInfo) => {
    const pair = `flowchart LR
  Client e1@--> API
  API e2@--> Client
  e1@{ step: 1 }
  e2@{ step: 2 }`;
    const options = { flowchart: { stepNumbers: true } };
    await imgSnapshotTest(page, testInfo, pair, options, false, async (svg) => {
      await pauseStepAnimationAt(1.5)(svg);

      const layout = await svg.evaluate((element: SVGSVGElement) => {
        const ends = [
          ...element.querySelectorAll<SVGPathElement>('path[data-edge="true"]'),
        ].flatMap((path) => [
          path.getPointAtLength(0),
          path.getPointAtLength(path.getTotalLength()),
        ]);
        const badges = [...element.querySelectorAll('g.edge-step-badge')].map((badge) => {
          const [, x, y] = /translate\(([\d.e-]+),([\d.e-]+)\)/.exec(
            badge.getAttribute('transform') ?? ''
          )!;
          return { x: Number(x), y: Number(y) };
        });
        const nearest = Math.min(
          ...badges.flatMap((badge) =>
            ends.map((end) => Math.hypot(badge.x - end.x, badge.y - end.y))
          )
        );
        const layer = element.querySelector('g.edge-step-badges');
        const lastDot = [...element.querySelectorAll('circle.edge-step-dot')].pop();
        return {
          badges: badges.length,
          clearOfArrowheads: nearest >= 17,
          layerAboveDots: !!(
            layer &&
            lastDot &&
            lastDot.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING
          ),
        };
      });

      expect(layout).toEqual({ badges: 2, clearOfArrowheads: true, layerAboveDots: true });
    });
  });
});
