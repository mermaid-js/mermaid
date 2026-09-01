import { expect, test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('timing diagram', () => {
  test('renders digital, state, bus, and analog lanes', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `timingDiagram-beta
        title Synchronous bus read
        timeUnit ns
        clock CLK as "Clock" : period 2
        binary RST as "Reset"
        binary EN as "Enable"
        bus DATA as "Data bus"
        state S as "Controller" : Idle, Waiting, Reading
        analog V as "Voltage" : min 0, max 5, interpolation linear

        RST : 1 x2, 0 x6
        EN : 0 x2, 1 x4, 0 x2
        DATA : Z x2, "D0", "D1", "D2", "D3", Z x2

        at 0
          S is Idle
          V is 0
        at 2
          S is Waiting
          V is 3.3
        at 4
          S is Reading
          V is 5`
    );

    await expect(page.locator('svg')).toHaveCount(1);
    await expect(page.locator('.timing-lane')).toHaveCount(6);
  });
});
