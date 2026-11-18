import { expect, test } from '@playwright/test';
import { imgSnapshotTest } from '../../../helpers/util.ts';

test.describe('timing diagram', () => {
  test('holds short sequences and preserves narrow field labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `timingDiagram-beta
      clock CLK : period 16
      binary EN
      bus FIELD
      EN : 0, 1
      FIELD : SOF, RTR, IDE, r0, ACK, DEL, Idle`,
      { screenshot: false }
    );
    const axisEnd = await page.locator('.timing-clock').getAttribute('d');
    const lastWaveEnd = await page.locator('.timing-binary').last().getAttribute('x2');
    expect(axisEnd).toContain(`H ${lastWaveEnd}`);
    await expect(page.locator('.timing-bus-segment title')).toHaveText([
      'SOF',
      'RTR',
      'IDE',
      'r0',
      'ACK',
      'DEL',
      'Idle',
    ]);
    await expect(page.locator('.timing-bus-label')).toHaveText('Idle');
  });

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

  test('honors scoped themes and font sizes in the browser', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
config:
  timing:
    theme: dark
  themeVariables:
    fontSize: 20px
---
timingDiagram-beta
  accTitle: Scoped timing example
  binary EN
  EN : 0, 1`,
      { screenshot: false }
    );
    await expect(page.locator('.timing-root')).toHaveCSS('font-size', '20px');
    await expect(page.locator('.timing-signal-label')).toHaveCSS('font-size', '16.25px');
    await expect(page.locator('svg')).toHaveAttribute('aria-roledescription', 'timingDiagram');
    await expect(page.locator('svg title')).toHaveText('Scoped timing example');
  });
});
