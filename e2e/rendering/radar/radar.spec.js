import { test, expect } from '@playwright/test';

import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('radar structure', () => {
  test('should render a simple radar diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `radar-beta
                title Best Radar Ever
                axis A, B, C
                curve c1{1, 2, 3}
            `
    );
  });

  test('should render a radar diagram with multiple curves', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `radar-beta
                title Best Radar Ever
                axis A, B, C
                curve c1{1, 2, 3}
                curve c2{2, 3, 1}
            `
    );
  });

  test('should render a complex radar diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `radar-beta 
                title My favorite ninjas
                axis Agility, Speed, Strength
                axis Stam["Stamina"] , Intel["Intelligence"]

                curve Ninja1["Naruto Uzumaki"]{
                    Agility 2, Speed 2,
                    Strength 3, Stam 5,
                    Intel 0
                }
                curve Ninja2["Sasuke"]{2, 3, 4, 1, 5}
                curve Ninja3 {3, 2, 1, 5, 4}

                showLegend true
                ticks 3
                max 8
                min 0
                graticule polygon
            `
    );
    await expect(page.locator('svg')).toHaveCount(1);
  });

  test('should render radar diagram with config override', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `radar-beta
                title Best Radar Ever
                axis A,B,C
                curve mycurve{1,2,3}`,
      { radar: { marginTop: 100, axisScaleFactor: 0.5 } }
    );
  });

  test('should parse radar diagram with theme override', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `radar-beta
                axis A,B,C
                curve mycurve{1,2,3}`,
      { theme: 'base', themeVariables: { fontSize: 80, cScale0: '#FF0000' } }
    );
  });

  test('should handle radar diagram with radar style override', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `radar-beta
                axis A,B,C
                curve mycurve{1,2,3}`,
      { theme: 'base', themeVariables: { radar: { axisColor: '#FF0000' } } }
    );
  });
});
