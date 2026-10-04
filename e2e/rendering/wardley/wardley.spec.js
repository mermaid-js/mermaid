import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('Wardley Maps', () => {
  ['dark', 'forest', 'neutral', 'base'].forEach((theme) => {
    test(`should render under the ${theme} theme`, async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
wardley-beta
title Theme Test - ${theme}
size [1100, 800]

anchor User [0.95, 0.85]
component App [0.75, 0.70]
component API [0.55, 0.55]
component Database [0.30, 0.60]
component Cache [0.50, 0.40]

User -> App
App -> API
API -> Database
API -> Cache

evolve Database 0.80
        `,
        { theme }
      );
    });
  });
});
