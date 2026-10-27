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

test.describe('flowchart step highlight', () => {
  test('should highlight only the edge whose step is playing', async ({ page }, testInfo) => {
    await imgSnapshotTest(page, testInfo, stepFlow, {}, false, async (svg) => {
      await pauseStepAnimationAt(1.5)(svg);

      expect(await visibleSteps(svg, 'path.edge-step-highlight')).toEqual(['2']);
      expect(await visibleSteps(svg, 'circle.edge-step-dot')).toEqual(['2']);
    });
  });

  test('should colour the dot and the highlight with the bare edge colour in handDrawn look', async ({
    page,
  }, testInfo) => {
    const redFlow = `${stepFlow}
  linkStyle default stroke:red`;
    await imgSnapshotTest(page, testInfo, redFlow, { look: 'handDrawn' }, false, async (svg) => {
      await pauseStepAnimationAt(1.5)(svg);

      expect(await visibleSteps(svg, 'path.edge-step-highlight')).toEqual(['2']);
      expect(await visibleSteps(svg, 'circle.edge-step-dot')).toEqual(['2']);
      const highlightStrokes = await svg
        .locator('path.edge-step-highlight')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('stroke')));
      const dotFills = await svg
        .locator('circle.edge-step-dot')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('fill')));
      expect(highlightStrokes).toEqual(['red', 'red', 'red']);
      expect(dotFills).toEqual(['red', 'red', 'red']);
    });
  });
});
