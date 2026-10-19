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

test.describe('flowchart step duration', () => {
  test('should play the second step earlier with a shorter step duration', async ({
    page,
  }, testInfo) => {
    const options = { flowchart: { stepDuration: 0.5 } };
    await imgSnapshotTest(page, testInfo, stepFlow, options, false, async (svg) => {
      await pauseStepAnimationAt(0.75)(svg);

      expect(await visibleSteps(svg, 'circle.edge-step-dot')).toEqual(['2']);
    });
  });
});
