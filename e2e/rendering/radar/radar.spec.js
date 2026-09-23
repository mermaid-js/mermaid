import { test, expect } from '@playwright/test';
import sharp from 'sharp';

import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('radar structure', () => {
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

  const renderBand = async (page, testInfo, axes, entries) => {
    await renderGraph(
      page,
      testInfo,
      `radar-beta
      axis ${axes}
      curve c1{${entries}}
      max 10`,
      {
        screenshot: false,
        theme: 'base',
        themeVariables: {
          cScale0: '#ff0000',
          radar: { curveOpacity: 1, curveStrokeWidth: 0, axisStrokeWidth: 0, graticuleOpacity: 0 },
        },
      }
    );
  };

  const pixelAt = async (page, x, y) => {
    const position = await page
      .locator('.radarAxisLine')
      .first()
      .evaluate(
        (axis, [x, y]) => {
          const point = new DOMPoint(x, y).matrixTransform(axis.getScreenCTM());
          return { x: Math.floor(point.x), y: Math.floor(point.y) };
        },
        [x, y]
      );
    const screenshot = await page.screenshot({
      clip: { ...position, width: 1, height: 1 },
      scale: 'css',
    });
    const pixel = await sharp(screenshot).removeAlpha().raw().toBuffer();
    return [...pixel];
  };

  test('should preserve literal fill when equivalent range syntax is used', async ({
    page,
  }, testInfo) => {
    for (const entries of [
      '0,0,1,10,0,0,10',
      '[0..0],0,1,10,0,0,10',
      '[0..0],[0..0],[0..1],[0..10],[0..0],[0..0],[0..10]',
    ]) {
      await renderBand(page, testInfo, 'A,B,C,D,E,F,G', entries);
      expect(await pixelAt(page, 6, 0)).toEqual([255, 0, 0]);
    }
  });

  test('should not fill outside the upper envelope when smoothed boundaries cross', async ({
    page,
  }, testInfo) => {
    await renderBand(
      page,
      testInfo,
      'A,B,C,D,E,F,G,H',
      '[5..5.1],[5..5.1],[5..5.1],[5..5.1],[5..5.1],[5..5.1],[5..5.1],[5..10]'
    );
    expect(await pixelAt(page, 34.5, -144)).toEqual([255, 255, 255]);
    expect(await pixelAt(page, -180, -180)).toEqual([255, 0, 0]);
  });
});
