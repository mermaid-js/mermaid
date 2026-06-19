import { test } from '@playwright/test';
import { imgSnapshotTest } from '../helpers/util.ts';

test.describe('Current diagram', () => {
  test('should render a state with states in it', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram
      state PersonalizedCockpit {
        Other
        state  Parent {
          C
        }
    }
    `,
      {
        logLevel: 0,
      }
    );
  });
});
