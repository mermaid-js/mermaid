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

test.describe('flowchart step animation', () => {
  test('should show only the dot of the step that is playing', async ({ page }, testInfo) => {
    await imgSnapshotTest(page, testInfo, stepFlow, {}, false, async (svg) => {
      await pauseStepAnimationAt(1.5)(svg);

      await expect(svg.locator('circle.edge-step-dot animateMotion')).toHaveCount(3);
      expect(await visibleSteps(svg, 'circle.edge-step-dot')).toEqual(['2']);
    });
  });
});
