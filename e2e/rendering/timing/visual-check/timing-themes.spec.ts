import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../../helpers/util.ts';

for (const theme of ['default', 'dark', 'forest', 'neutral', 'base'] as const) {
  test(`timing lanes with the ${theme} theme`, async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `timingDiagram-beta
      title Signal states
      clock CLK : period 2
      binary ENABLE
      bus DATA
      state MODE
      analog V : min 0, max 5, interpolation step
      ENABLE : 0, 1 x3, X, Z, 0 x2
      DATA : Z, "0x2A" x3, X x2, Z x2
      MODE : Idle, Running x3, Waiting x2, Idle x2
      V : 0, 5 x3, 2 x2, 0 x2`,
      { theme }
    );
  });
}
